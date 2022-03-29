// 删除表 表更名 增加字段 删除字段 修改字段
import { FormatMessage } from 'components';

import {getAllDataSQLByFilter, getDataByChanges} from './json2code_util';
import _ from 'lodash/object';
import {transform} from './datasource_util';

const compareField = (currentFields, preFields, names = [], type = 'field', refactor, inject = false) => {
  const deleteId = [];
  const addId = [];
  const changedId = [];
  currentFields.forEach((c, i) => {
    if (preFields.findIndex(p => p.id === c.id) < 0) {
      addId.push({opt: 'add', type: type === 'entity' ? c.type :  type, data: {
          before: currentFields[i-1] || {},
          current: c,
          after: currentFields[i+1] || {}
        }})
    } else {
      const preField = preFields.filter(p => p.id === c.id)[0];
      const fieldChange = names.map((n) => {
        if (preField[n] !== c[n]) {
          const refactorData = refactor && refactor(n, preField[n], c[n], preField, c);
          if (refactorData) {
            if (inject && refactorData.length > 0) {
              return {type: n, pre: preField[n], new: c[n], changes: refactorData};
            } else {
              changedId.push(...refactorData.map(r => ({...r, parent: [preField, c]})));
              return null;
            }
          }
          return {type: n, pre: preField[n], new: c[n]};
        }
        return null;
      }).filter(f => !!f);
      if (fieldChange.length > 0) {
        changedId.push({opt: 'update', type: type === 'entity' ? c.type :  type, data: {
            oldData: preField,
            newData: c,
            changes: fieldChange
          }})
      }
    }
  });
  preFields.forEach(p => {
    if (currentFields.findIndex(c => c.id === p.id) < 0) {
      deleteId.push({opt: 'delete', type: type === 'entity' ? p.type :  type, data: p})
    }
  });
  return deleteId.concat(addId).concat(changedId);
}

const getEntityAndViewId = (data) => {
  return (data.entities || []).map(e => ({...e, type: 'entity'}))
      .concat((data.views || []).map(v => ({...v, type: 'view'}))).map(d => ({...d, type: d.type}));
}

const refactorIndexField = (fieldChanges, preParent, curParent) => {
  const getFieldName = (id, entity) => {
    const currentField = (entity.fields || []).filter(f => f.id === id)[0];
    return currentField?.defName || currentField?.defKey || id;
  };
  return fieldChanges.map(d => {
    // 对ID等数据进行转换
    if (d.opt === 'delete') {
      return {
        ...d,
        data: {
          ...d.data,
          fieldDefKey: getFieldName(d.data.fieldDefKey, preParent),
        }
      }
    } else if (d.opt === 'update') {
      return {
        ...d,
        data: {
          ...d.data,
          newData: {
            ...d.data.newData,
            fieldDefKey: getFieldName(d.data?.newData?.fieldDefKey, curParent),
          },
          oldData: {
            ...d.data.oldData,
            fieldDefKey: getFieldName(d.data?.oldData?.fieldDefKey, preParent),
          }
        }
      }
    }
    return {
      ...d,
      data: {
        ...d.data,
        current: {
          ...d.data.current,
          fieldDefKey: getFieldName(d.data.current?.fieldDefKey, curParent),
        }
      }
    }
  })
}

const refactorEntityFields = (fields, preDataSource, currentDataSource) => {
  const code = _.get(currentDataSource, 'profile.default.db', currentDataSource.profile?.dataTypeSupports[0]?.id);
  return fields.map(f => ({...f, ...transform(f, preDataSource, code)}));
}

const compareEntityAndView = (currentDataSource, preDataSource) => {
  const preEntityAndView = getEntityAndViewId(preDataSource);
  const currentEntityAndView = getEntityAndViewId(currentDataSource);
  return compareField(currentEntityAndView, preEntityAndView, ['comment', 'defKey', 'defName', 'fields', 'indexes'], 'entity', (name, pre, curr, preParent, curParent) => {
    if (name === 'fields') {
      return compareField(refactorEntityFields(curr, currentDataSource, currentDataSource),
          refactorEntityFields(pre, preDataSource, currentDataSource), ['autoIncrement', 'comment', 'defKey', 'defName',
        'defaultValue', 'domain', 'len', 'notNull',
        'primaryKey', 'refDict', 'scale', 'type', 'uiHint'], 'field');
    } else if (name === 'indexes') {
      return compareField(curr, pre, ['comment', 'defKey', 'defName', 'fields', 'unique'], 'index', (n, p, c) => {
        if (n === 'fields') {
          return refactorIndexField(compareField(c, p, ['ascOrDesc', 'fieldDefKey'], 'index.field'), preParent, curParent);
        }
      }, true);
    }
  });
}

// 判断当前是否有变更
export const checkUpdate = (dataSource, preDataSource = dataSource) => {
  return compareEntityAndView(dataSource, preDataSource);
}

// 根据差异生成SQL
export const genSelByDiff = (current, pre, dataSource) => {
  if(!pre?.data) {
    const code = _.get(dataSource, 'profile.default.db', dataSource.profile?.dataTypeSupports[0]?.id);
    return getAllDataSQLByFilter(current.data, code, ['createTable', 'createIndex', 'content']);
  }
  return getDataByChanges(compareEntityAndView(current.data, pre.data), current.data, dataSource);
};

// 根据变更信息生成SQL
export const getChanges = (changes, preDataSource, currentDataSource) => {
  return getDataByChanges(changes, preDataSource, currentDataSource);
}

// 根据变更信息生成提示信息
export const getMessageByChanges = (changes, initParent, id) => {
  const getLangString = (type, name) => {
    if (type === 'entity' || type === 'view') {
      return `tableBase.${name}`;
    } else if (type === 'index') {
      if (name === 'defKey') {
        return 'tableHeaders.indexesName';
      } else if (name === 'unique') {
        return 'tableHeaders.indexIsUnique';
      } else if (name === 'comment') {
        return 'tableHeaders.indexComment';
      }
      return `tableHeaders.${name}`;
    }
    return `tableHeaders.${name}`;
  }
  return changes.reduce((c, n) => {
    const parent = n.parent?.[0] || initParent;
    if (n.opt === 'update') {
      return c.concat((n.data?.changes || []).reduce((a, b) => {
        if (b.changes) {
          return a.concat(getMessageByChanges(b.changes, {
            defName: `${parent?.defName || parent?.defKey}${FormatMessage.string({id: 'versionData.index'})}${n.data?.oldData?.defName || n.data?.oldData?.defKey}`
          }, 'fieldDefKey'));
        }
        return a.concat(`${FormatMessage.string({id: `versionData.${n.opt}Data`})}${parent ? `${FormatMessage.string({id: `versionData.${parent.type}`})}[${parent?.defName || parent?.defKey}]` : ''}${FormatMessage.string({id: `versionData.${n.type === 'index.field' ? 'indexField' : n.type}`})}[${n.data?.oldData?.[id || 'defName'] || n.data?.oldData?.defKey}][${FormatMessage.string({id: `${getLangString(n.type, b.type)}`})}][${b.pre}===>${b.new}]`);
      }, []));
    } else if (n.opt === 'delete') {
      return c.concat(`${FormatMessage.string({id: `versionData.${n.opt}Data`})}${parent ? `${FormatMessage.string({id: `versionData.${parent.type}`})}[${parent?.defName || parent?.defKey}]` : ''}${FormatMessage.string({id: `versionData.${n.type === 'index.field' ? 'indexField' : n.type}`})}[${n.data?.[id || 'defName'] || n.data?.defKey}]`);
    } else {
      return c.concat(`${FormatMessage.string({id: `versionData.${n.opt}Data`})}${parent ? `${FormatMessage.string({id: `versionData.${parent.type}`})}[${parent?.defName || parent?.defKey}]` : ''}${FormatMessage.string({id: `versionData.${n.type === 'index.field' ? 'indexField' : n.type}`})}[${n.data?.current?.[id || 'defName'] || n.data?.current?.defKey}]`);
    }
  },  []);
};


