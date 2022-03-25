// 删除表 表更名 增加字段 删除字段 修改字段

import {getAllDataSQLByFilter, getDataByChanges} from './json2code_util';
import _ from 'lodash/object';

const compareField = (currentFields, preFields) => {
  const deleteId = [];
  const addId = [];
  const changedId = [];
  currentFields.forEach((c, i) => {
    if (preFields.findIndex(p => p.id === c.id) < 0) {
      addId.push({opt: 'add', type: 'field', data: {
          before: currentFields[i-1] || {},
          current: c,
          after: currentFields[i+1] || {}
        }})
    } else {
      const preField = preFields.filter(p => p.id === c.id)[0];
      const fieldChange = Object.keys(preField).map(p => {
        if (preField[p] !== c[p]) {
          return {type: p, pre: preField[p], new: c[p]};
        }
        return null;
      }).filter(f => !!f);
      if (fieldChange.length > 0) {
        changedId.push({opt: 'update', type: 'field', data: {
            oldData: preField,
            newData: c,
            changes: fieldChange
          }})
      }
    }
  });
  preFields.forEach(p => {
    if (currentFields.findIndex(c => c.id === p.id) < 0) {
      deleteId.push({opt: 'delete', type: 'field', data: p})
    }
  });
  return deleteId.concat(addId).concat(changedId);
}

const getEntityAndViewId = (data) => {
  return (data.entities || []).map(e => ({...e, type: 'entity'}))
      .concat((data.views || []).map(v => ({...v, type: 'view'}))).map(d => ({...d, type: d.type}));
}

const compareEntityAndView = (currentDataSource, preDataSource) => {
  const preEntityAndView = getEntityAndViewId(preDataSource);
  const currentEntityAndView = getEntityAndViewId(currentDataSource);
  const deleteId = [];
  const addId = [];
  const changedId = [];
  currentEntityAndView.forEach(c => {
    if (preEntityAndView.findIndex(p => p.id === c.id) < 0) {
      addId.push({opt: 'add', type: c.type, data: c});
    } else {
      const preEntity = preEntityAndView.filter(p => p.id === c.id && p.type === c.type)[0];
      if (c.defKey !== preEntity?.defKey) {
        changedId.push({opt: 'update', type: c.type, data: {oldData: preEntity, newData: c}});
      }
      changedId.push(...compareField(c.fields, preEntity.fields));
    }
  });
  preEntityAndView.forEach(p => {
    if (currentEntityAndView.findIndex(c => c.id === p.id) < 0) {
      deleteId.push({opt: 'delete', type: p.type, data: p})
    }
  });
  return deleteId.concat(addId).concat(changedId);
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


