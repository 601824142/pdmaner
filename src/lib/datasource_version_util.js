// 删除表 表更名 增加字段 删除字段 修改字段
import { FormatMessage } from 'components';
import demoProject from '../lib/template/教学管理系统.chnr.json';

import {getAllDataSQLByFilter, getDataByChanges, getTemplateString, getEmptyMessage } from './json2code_util';
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
  return fields.map(f => ({...f, ...transform(f, {
      ...preDataSource,
      domains: currentDataSource.domains,
      profile: {
        ...currentDataSource.profile,
        default: {
          ...currentDataSource.profile?.default,
          db: _.get(currentDataSource, 'profile.default.db')
        }
      },
      dataTypeMapping: {
        ...currentDataSource.dataTypeMapping,
        mappings: currentDataSource.dataTypeMapping.mappings || []
      }
    }, code)}));
}

const compareObj = (current, pre, names, omitNames = [], refactor) => {
  const compareNames = names || [...new Set(Object.keys(current).concat(Object.keys(pre)))];
  return compareNames.filter(n => !omitNames.includes(n)).reduce((p, n) => {
    if (!(n in current)) {
      return p.concat({opt: 'delete', data: n});
    } else if (!(n in pre)) {
      return p.concat({opt: 'add', data: n});
    } else if (current[n] !== pre[n]) {
      if (refactor && (Array.isArray(current[n]) || Array.isArray(pre[n]))) {
        return p.concat(refactor(current[n], pre[n]));
      }
      return p.concat({opt: 'update', data: n, pre: pre[n], new: current[n]});
    }
    return p;
  }, []);
}

const compareArray = (current = [], pre = [], type, names, omitNames, id = 'id', refactor) => {
  return current.concat(pre).reduce((p, n) => {
    if (current.findIndex(c => c[id] === n[id]) < 0) {
      return p.concat({opt: 'delete', data: n, type});
    } else if (pre.findIndex(c => c[id] === n[id]) < 0) {
      return p.concat({opt: 'add', data: n, type});
    } else if (p.findIndex(c => c.data[id] === n[id]) < 0){
      const cData = current.filter(c => c[id] === n[id])[0];
      const pData = pre.filter(c => c[id] === n[id])[0];
      let baseChanged;
      const baseChanges = compareObj(cData, pData, names, omitNames, refactor);
      if (baseChanges.length > 0) {
        baseChanged = {
          before: names ? _.pick(pData, names) : pData,
          after:  names ? _.pick(cData, names) : cData,
        }
      }
      if (baseChanged) {
        return p.concat({
          type,
          opt: 'update',
          data: {
            [id]: cData[id],
            ...baseChanged,
          },
        });
      }
      return p;
    }
    return p;
  }, []);
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
    } else if (name === 'correlations') {
      return compareField(curr.map(p => ({id: p.refEntity})), pre.map(c => ({id: c.refEntity})), [], 'correlation');
    } else if (name === 'properties') {
      return compareObj(curr, pre).map(d => ({...d, type: 'properties'}))
    }
  });
}

// 判断当前是否有变更
export const checkUpdate = (dataSource, preDataSource = dataSource) => {
  return compareEntityAndView(dataSource, preDataSource);
}

// 根据变更信息生成SQL
export const getChanges = (changes, currentDataSource) => {
  return getDataByChanges(changes, currentDataSource);
}

// 根据变更信息生成提示信息
export const getMessageByChanges = (changes, dataSource) => {
  // const getLangString = (type, name) => {
  //   if (type === 'entity' || type === 'view') {
  //     return `tableBase.${name}`;
  //   } else if (type === 'index') {
  //     if (name === 'defKey') {
  //       return 'tableHeaders.indexesName';
  //     } else if (name === 'unique') {
  //       return 'tableHeaders.indexIsUnique';
  //     } else if (name === 'comment') {
  //       return 'tableHeaders.indexComment';
  //     }
  //     return `tableHeaders.${name}`;
  //   }
  //   return `tableHeaders.${name}`;
  // }
  // return changes.reduce((c, n) => {
  //   const parent = n.parent?.[0] || initParent;
  //   if (n.opt === 'update') {
  //     // return c.concat((n.data?.changes || []).reduce((a, b) => {
  //     //   if (b.changes) {
  //     //     return a.concat(getMessageByChanges(b.changes, {
  //     //       defName: `${parent?.defName || parent?.defKey}.${n.data?.oldData?.defName || n.data?.oldData?.defKey}`
  //     //     }, 'fieldDefKey'));
  //     //   }
  //     //   // 1. 修改表[表代码/表名称]，代码：[OLD -> NEW]
  //     //   return c.concat(`${FormatMessage.string({id: `versionData.${n.opt}Data`})}${FormatMessage.string({id: `versionData.${n.type === 'index.field' ? 'indexField' : n.type}`})}[${parent ? `${parent?.defName || parent?.defKey}.` : ''}${n.data?.oldData?.[id || 'defName'] || n.data?.oldData?.defKey}], ${FormatMessage.string({id: `${getLangString(n.type, b.type)}`})}: [${b.pre} -> ${b.new}]`);
  //     //   //return a.concat(`${FormatMessage.string({id: `versionData.${n.opt}Data`})}${parent ? `${FormatMessage.string({id: `versionData.${parent.type}`})}[${parent?.defName || parent?.defKey}]` : ''}${FormatMessage.string({id: `versionData.${n.type === 'index.field' ? 'indexField' : n.type}`})}[${n.data?.oldData?.[id || 'defName'] || n.data?.oldData?.defKey}][${FormatMessage.string({id: `${getLangString(n.type, b.type)}`})}][${b.pre}===>${b.new}]`);
  //     // }, []));
  //     return c.concat((n.data?.changes || []).reduce((a, b) => {
  //       return a.concat(b.changes ? [] : `${FormatMessage.string({id: `versionData.${n.opt}Data`})}${FormatMessage.string({id: `versionData.${n.type === 'index.field' ? 'indexField' : n.type}`})}[${parent ? `${parent?.defName || parent?.defKey}.` : ''}${n.data?.oldData?.[id || 'defName'] || n.data?.oldData?.defKey}], ${FormatMessage.string({id: `${getLangString(n.type, b.type)}`})}: [${b.pre} -> ${b.new}]`)
  //           .concat(getMessageByChanges(b.changes || [], {
  //             defName: parent ? `${parent?.defName || parent?.defKey}.${n.data?.oldData?.defName || n.data?.oldData?.defKey}` : `${n.data?.oldData?.defName || n.data?.oldData?.defKey}`
  //           }, 'fieldDefKey'));
  //     }, []));
  //    // return c.concat(`${FormatMessage.string({id: `versionData.${n.opt}Data`})}${FormatMessage.string({id: `versionData.${n.type === 'index.field' ? 'indexField' : n.type}`})}[${parent ? `${parent?.defName || parent?.defKey}.` : ''}${n.data?.oldData?.[id || 'defName'] || n.data?.oldData?.defKey}], ${FormatMessage.string({id: `${getLangString(n.type, b.type)}`})}: [${b.pre} -> ${b.new}]`);
  //   } else if (n.opt === 'delete') {
  //     return c.concat(`${FormatMessage.string({id: `versionData.${n.opt}Data`})}${FormatMessage.string({id: `versionData.${n.type === 'index.field' ? 'indexField' : n.type}`})}:${parent ? `${parent?.defName || parent?.defKey}.` : ''}${n.data?.[id || 'defName'] || n.data?.defKey}`);
  //   } else {
  //     // 新增字段:表名称.字段名 数据类型
  //     return c.concat(`${FormatMessage.string({id: `versionData.${n.opt}Data`})}${FormatMessage.string({id: `versionData.${n.type === 'index.field' ? 'indexField' : n.type}`})}:${parent ? `${parent?.defName || parent?.defKey}.` : ''}${n.data?.current?.[id || 'defName'] || n.data?.current?.defKey}${(n.data?.current?.type && parent) ? ` ${n.data?.current?.type}` : ''}`);
  //   }
  // },  []);
  try {
    const code = _.get(dataSource, 'profile.default.db', dataSource.profile?.dataTypeSupports[0]?.id);
    const allTemplate = _.get(dataSource, 'profile.codeTemplates', []);
    const codeTemplate = allTemplate.filter(t => t.applyFor === code)[0] || {};
    const sqlSeparator = _.get(dataSource, 'profile.sql.delimiter', ';');
    return getTemplateString(codeTemplate.message || demoProject.profile.codeTemplates[0].message, {
      changes,
      separator: sqlSeparator,
    }, false, dataSource, code);
  } catch (e) {
    return JSON.stringify(e.message, null, 2);
  }
};


export const packageChanges = (currentDataSource, preDataSource) => {
  const assembling = (current = [], pre = [], type) => {
    const setNull = (data) => {
      if (data.length > 0) {
        return data;
      }
      return null;
    };
    const refactorData = (d, p, c) => {
      const fields = refactorEntityFields(d.fields || [], p, c);
      const viewData = {};
      if (d.refEntities && d.refEntities.length > 0) {
        viewData.refEntities = (c.entities || [])
            .filter(e => d.refEntities.includes(e.id)).map(e => e.defKey);
      }
      return {
        ...d,
        fields,
        indexes: (d.indexes || []).map(i => {
          return {
            ...i,
            fields: (i.fields || []).map(f => {
              return {
                ...f,
                fieldDefKey: fields.filter(field => field.id === f.fieldDefKey)[0]?.defKey,
              };
            }),
          }
        }),
        ...viewData,
      }
    }
    const currentData = current.map(d => refactorData(d, currentDataSource, currentDataSource));
    const preData = pre.map(d => refactorData(d, preDataSource, currentDataSource))
    const allData = currentData.concat(preData);
    return allData.reduce((p, n) => {
      if (currentData.findIndex(c => c.id === n.id) < 0) {
        return p.concat({opt: 'delete', data: {...n, type}, type});
      } else if (preData.findIndex(c => c.id === n.id) < 0) {
        return p.concat({opt: 'add', data: {...n, type}, type});
      } else if (p.findIndex(c => c.data.id === n.id) < 0){
        const cData = currentData.filter(c => c.id === n.id)[0];
        const pData = preData.filter(c => c.id === n.id)[0];
        // 1.比较基础信息
        // 'comment', 'defKey', 'defName'
        let baseChanged, propChanged, fieldChanged, refEntityChanged, indexChanged;
        const baseNames = ['comment', 'defKey', 'defName'];
        const baseChanges = compareObj(cData, pData, baseNames);
        if (baseChanges.length > 0) {
          baseChanged = {
            before: _.pick(pData, baseNames),
            after:  _.pick(cData, baseNames)
          }
        }
        // 2.字段调整
        const fieldsChange = compareArray(cData.fields, pData.fields, 'field', null, ['refDictData']);
        if (fieldsChange.length > 0) {
          fieldChanged = {
            fieldAdded: setNull(fieldsChange.filter(c => c.opt === 'add').map(c => {
              const index = cData.fields.findIndex(f => f.id === c.data.id);
              return {
                ...c.data,
                index,
                beforeFieldKey: cData.fields[index + 1]?.defKey || null,
                afterFieldKey: cData.fields[index - 1]?.defKey || null,
              }
            })),
            fieldRemoved: setNull(fieldsChange.filter(c => c.opt === 'delete').map(c => c.data)),
            fieldModified: setNull(fieldsChange.filter(c => c.opt === 'update').map(c => c.data))
          }
        }
        // 3.扩展属性调整
        const propsChange = compareObj(cData.properties || {}, pData.properties || {});
        if (propsChange.length > 0) {
          propChanged = {
            propAdded: setNull(propsChange.filter(c => c.opt === 'add').map(c => {
              return {
                key: c.data,
                value: cData.properties[c.data],
              };
            })),
            propRemoved: setNull(propsChange.filter(c => c.opt === 'delete').map(c => {
              return {
                key: c.data,
                value: pData.properties[c.data],
              };
            })),
            propModified: setNull(propsChange.filter(c => c.opt === 'update').map(c => {
              return {
               before: {
                 key: c.data,
                 value: cData.properties[c.data],
               },
                after: {
                  key: c.data,
                  value: pData.properties[c.data],
                }
              };
            })),
          }
        }
        // 4.关联实体调整
        const refEntityChange = compareArray(cData.correlations || [], pData.correlations || [], type, [], [], 'refEntity');
        if (refEntityChange.length > 0) {
          refEntityChanged = {
            refEntityAdd: setNull(refEntityChange.filter(c => c.opt === 'add').map(c => {
              const data = allData.filter(d => d.id === c.data.refEntity)[0];
              return _.pick(data, baseNames);
            })),
            refEntityRemoved: setNull(refEntityChange.filter(c => c.opt === 'delete').map(c => {
              const data = allData.filter(d => d.id === c.data.refEntity)[0];
              return _.pick(data, baseNames);
            })),
          }
        }
        // 5. 索引调整indexes: Array(1)
        const indexChange = compareArray(cData.indexes || [], pData.indexes || [], type, baseNames.concat(['unique', 'fields']), [], 'id', (c, p) => {
          return compareArray(c, p, type);
        });
        if (indexChange.length > 0) {
          const calcIndexField = (fields) => {
            const allFields = cData.fields?.concat(preData.fields || []) || [];
            return fields.map(c => {
              if (c.opt !== 'update') {
                return {
                  ...c.data,
                  fields: (c.data?.fields || []).map(f => {
                    return {
                      ...f,
                      fieldDefKey: allFields.filter(a => a.id === f.fieldDefKey)[0]?.defkey
                    }
                  })
                }
              }
              return {
                ...c.data,
                after: {
                  ...c.data.after,
                  fields: (c.data?.after?.fields || []).map(f => {
                    return {
                      ...f,
                      fieldDefKey: allFields.filter(a => a.id === f.fieldDefKey)[0]?.defKey
                    }
                  })
                },
                before: {
                  ...c.data.before,
                  fields: (c.data?.before?.fields || []).map(f => {
                    return {
                      ...f,
                      fieldDefKey: allFields.filter(a => a.id === f.fieldDefKey)[0]?.defKey
                    }
                  })
                },
              }
            })
          }
          indexChanged = {
            indexAdded: setNull(calcIndexField(indexChange.filter(c => c.opt === 'add'))),
            indexRemoved: setNull(calcIndexField(indexChange.filter(c => c.opt === 'delete'))),
            indexModified: setNull(calcIndexField(indexChange.filter(c => c.opt === 'update'))),
          }
        }
        if (baseChanged || fieldChanged || propChanged || refEntityChanged || indexChanged) {
          return p.concat({
            type,
            opt: 'update',
            data: {
              id: cData.id,
              baseInfo: _.pick(cData, baseNames),
              baseChanged: baseChanged || null,
              fieldAdded: null,
              fieldRemoved: null,
              fieldModified: null,
              propAdded: null,
              propRemoved: null,
              propModified: null,
              refEntityAdd: null,
              refEntityRemoved: null,
              indexAdded: null,
              indexRemoved: null,
              indexModified: null,
              ...fieldChanged,
              ...propChanged,
              ...refEntityChanged,
              indexChanged: !!indexChanged,
              ...indexChanged,
              fullFields: cData.fields || [],
              newIndexes: cData.indexes || [],
            },
          });
        }
        return p;
      }
      return p;
    }, []);
  };
  return assembling(currentDataSource.entities, preDataSource.entities, 'entity')
      .concat(assembling(currentDataSource.views, preDataSource.views, 'view'))
}

export const getMaxVersion = (sortData) => {
  const numArray = sortData[0]?.name?.split('.');
  if (!numArray) {
    return 'v1.0.0';
  }
  return numArray.map((v, i) => {
    if (i === numArray.length - 1) {
      return `${parseInt(v, 10) + 1}`
    }
    return v;
  }).join('.');
}
