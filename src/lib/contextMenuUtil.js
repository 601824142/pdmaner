import React from 'react';
import _ from 'lodash/object';

import { Button, openModal, Modal, Message, FormatMessage } from 'components';

import { Copy, Paste } from './event_tool';
import NewEntity from '../app/container/entity/NewEntity';
import NewView from '../app/container/view/NewViewStep';
import NewRelation from '../app/container/relation/NewRelation';
import NewDict from '../app/container/dict/NewDict';
import NewGroup from '../app/container/group';
import SelectGroup from '../app/container/group/SelectGroup';
import DataType from '../app/container/datatype';
import Domain from '../app/container/domain';
import Preview from '../app/container/database';
import { getEmptyEntity, getEmptyView, emptyRelation, emptyGroup, emptyDomain, emptyDataType, emptyCodeTemplate,
  emptyDict, validateItem, validateKey, emptyDiagram, defaultTemplate, validateItemInclude, emptyDataTypeSupport,
 } from './datasource_util';
// 专门处理左侧菜单 右键菜单数据
import { separator } from '../../profile';

const opt = [{
  key: 'add',
  icon: 'fa-plus',
}, {
  key: 'delete',
  icon: 'fa-minus'
}, {
  key: 'move',
  icon: 'fa-arrows'
}, {
  key: 'copy',
  icon: 'fa-clone'
}, {
  key: 'cut',
  icon: 'fa-scissors'
}, {
  key: 'paste',
  icon: 'fa-clipboard'
}, {
  key: 'clear',
  icon: 'fa-eraser'
}, {
  key: 'edit',
  icon: 'fa-pencil-square-o'
}]; // 所有菜单操作的的KEY;

const normalOpt = ['add', 'copy', 'cut', 'paste', 'delete'];
const domainNormalOpt = ['add', 'clear'];
const domainChildNormalOpt = ['add', 'copy', 'paste', 'delete'];
const menusType = {
  groups: ['add', 'delete', 'clear', 'edit'],
  entities: normalOpt,
  entity: normalOpt.concat('move'),
  views: normalOpt,
  view: normalOpt.concat('move'),
  diagrams: normalOpt,
  diagram: normalOpt.concat('move', 'edit'),
  dicts: normalOpt,
  dict: normalOpt.concat('move'),
  domains: domainNormalOpt,
  domain: domainChildNormalOpt,
  dataTypeMapping: domainNormalOpt,
  mapping: domainChildNormalOpt,
  dataTypeSupport: domainNormalOpt,
  dataType: domainChildNormalOpt,
};

export const getMenu = (m, key, type, selectedMenu, groupType, parentKey, tempType = type) => {
  const getName = () => {
    const base = FormatMessage.string({id: `menus.opt.${m}`});
    if (m === 'move') {
      return base;
    } else if (m === 'edit' && type === 'diagram') {
      return FormatMessage.string({id: 'menus.opt.editRelation'});
    }
    return base + FormatMessage.string({id: `menus.${tempType}`});
  }
  return {
    key: m,
    dataKey: key,
    dataType: type,
    otherMenus: selectedMenu,
    groupType,
    parentKey,
    icon: opt.filter(o => o.key === m)[0]?.icon || '',
    name: getName(),
  }
};

export const getMenus = (key, type, selectedMenu, parentKey, groupType) => {
  return menusType[type].filter(m => {
    if (type === 'groups' && !key) {
      return m === 'add';
    }
    return m;
  }).map(m => {
    let tempType = type;
    if (type.endsWith('s') && (m === 'add') && (type !== 'groups')) {
      if (type === 'entities'){
        tempType = 'entity';
      } else {
        tempType = tempType.substring(0, tempType.length - 1);
      }
    }
    return getMenu(m, key, type, selectedMenu, groupType, parentKey, tempType);
  });
};

export const dealMenuClick = (dataSource, menu, updateDataSource, tabClose, callback) => {
  const { key } = menu;
  switch (key) {
    case 'add': addOpt(dataSource, menu, updateDataSource, {}, null, null, callback); break;
    case 'edit': editOpt(dataSource, menu, updateDataSource); break;
    case 'copy': copyOpt(dataSource, menu); break;
    case 'cut': cutOpt(dataSource, menu); break;
    case 'paste': pasteOpt(dataSource, menu, updateDataSource); break;
    case 'delete': deleteOpt(dataSource, menu, updateDataSource, tabClose); break;
    case 'clear': clearOpt(dataSource, menu, updateDataSource); break;
    case 'move': moveOpt(dataSource, menu, updateDataSource); break;
    default:break;
  }
};

const validate = (require, data) => {
  return !require.some(r => !data[r]);
};

const calcDefaultDb = (newData, oldData, db) => {
  if (newData.type === 'dbDDL') {
    if (newData.defaultDb) {
      return newData.applyFor;
    } else if (oldData.defaultDb && !newData.defaultDb) {
      Message.success({
        title: FormatMessage.string({id: 'dataType.defaultDbInfo'})
      });
      return newData.applyFor;
    }
  }
  return db;
}

const addOpt = (dataSource, menu, updateDataSource, oldData = {}, title, customerDealData, callback) => {
  // 新增操作合集
  const { dataType, parentKey } = menu;
  let modal = null;
  const data = {group: (parentKey && [parentKey]) || [], ...oldData};
  const dataChange = (value, name) => {
    data[name] = value;
  };
  const commonRequire = ['defKey'];
  const commonPick = ['defKey', 'defName'];
  const commonProps = { dataSource, dataChange };
  const commonAllKeys = (dataSource?.entities || []).concat(dataSource?.views || []).map(d => d.defKey);
  const modalComponent = {
    entities: {
      uniqueKey: 'defKey',
      uniqueKeyNamePath: 'tableBase.defKey',
      refName: 'refEntities',
      empty: getEmptyEntity([],
        _.get(dataSource, 'profile.default.entityInitProperties', {})),
      dataPick: commonPick.concat('fields'),
      component: NewEntity,
      title: FormatMessage.string({id: 'menus.add.newEntity'}),
      allKeys: commonAllKeys,
      require: commonRequire,
    },
    views: {
      uniqueKey: 'defKey',
      uniqueKeyNamePath: 'tableBase.defKey',
      refName: 'refViews',
      empty: getEmptyView(),
      dataPick: commonPick.concat(['refEntities', 'fields']),
      component: NewView,
      title: FormatMessage.string({id: 'menus.add.newView'}),
      allKeys: commonAllKeys,
      require: commonRequire,
    },
    diagrams: {
      uniqueKey: 'defKey',
      uniqueKeyNamePath: 'relation.defKey',
      refName: 'refDiagrams',
      empty: {
        ...emptyRelation,
        id: Math.uuid(),
      },
      dataPick: commonPick.concat('relationType'),
      component: NewRelation,
      title: FormatMessage.string({id: 'menus.add.newRelation'}),
      allKeys: (dataSource?.diagrams || []).map(d => d.defKey),
      require: commonRequire,
    },
    dicts: {
      uniqueKey: 'defKey',
      uniqueKeyNamePath: 'dict.defKey',
      refName: 'refDicts',
      empty: {
        ...emptyDict,
        id: Math.uuid(),
      },
      dataPick: commonPick,
      component: NewDict,
      title: FormatMessage.string({id: 'menus.add.newDict'}),
      allKeys: (dataSource?.dicts || []).map(d => d.defKey),
      require: commonRequire,
    },
    viewGroups: {
      uniqueKey: 'defKey',
      uniqueKeyNamePath: 'group.defKey',
      empty: {
        ...emptyGroup,
        id: Math.uuid(),
      },
      dataPick: commonPick.concat(['refEntities', 'refViews', 'refDiagrams', 'refDicts']),
      component: NewGroup,
      title: FormatMessage.string({id: 'menus.add.newGroup'}),
      allKeys: (dataSource?.viewGroups || []).map(d => d.defKey),
      require: commonRequire,
    },
    domains: {
      uniqueKey: 'defKey',
      uniqueKeyNamePath: 'domain.defKey',
      empty: {
        ...emptyDomain,
        id: Math.uuid(),
      },
      dataPick: 'all',
      component: Domain,
      title: FormatMessage.string({id: 'menus.add.newDomain'}),
      allKeys: (dataSource?.domains || []).map(d => d.defKey),
      require: commonRequire,
    },
    dataTypeMapping: {
      uniqueKey: 'defKey',
      uniqueKeyNamePath: 'dataType.defKey',
      empty: {
        ...emptyDataType,
        id: Math.uuid(),
      },
      dataPick: 'all',
      component: DataType,
      title: FormatMessage.string({id: 'menus.add.newDataType'}),
      allKeys: (dataSource?.dataTypeMapping?.mappings || []).map(d => d.defKey),
      require: commonRequire,
    },
    dataTypeSupports: {
      uniqueKey: 'defKey',
      uniqueKeyNamePath: 'database.name',
      empty: {
        defKey: '',
        id: Math.uuid()
      },
      dataPick: 'all',
      component: Preview,
      allKeys: (dataSource?.profile?.dataTypeSupports || []).map(d => d.defKey),
      title: FormatMessage.string({id: 'menus.add.newDataTypeSupport'}),
      require: commonRequire,
    },
  };
  const getRealType = () => {
    switch (dataType) {
      case 'entities':
      case 'entity': return 'entities';
      case 'views':
      case 'view': return 'views';
      case 'diagrams':
      case 'diagram': return 'diagrams';
      case 'dicts':
      case 'dict': return 'dicts';
      case 'groups': return 'viewGroups';
      case 'domain':
      case 'domains': return 'domains';
      case 'mapping':
      case 'dataTypeMapping': return 'dataTypeMapping';
      case 'dataType':
      case 'dataTypeSupport': return 'dataTypeSupports';
    }
  };
  const realType = getRealType();
  const modalData = modalComponent[realType];
  const onOK = () => {
    const result = validate(modalData.require, data);
    if (!result) {
      Modal.error({
        title: FormatMessage.string({id: 'optFail'}),
        message: FormatMessage.string({id: 'formValidateMessage'})
      });
    } else {
      if (customerDealData) {
        // 自定义处理数据
        customerDealData(data, modal);
      } else {
        const allKeys = modalData.allKeys;
        if (allKeys.includes(data[modalData.uniqueKey])) {
          Modal.error({
            title: FormatMessage.string({id: 'optFail'}),
            message: FormatMessage.string({
              id: 'entityAndViewUniquenessCheck',
              data: {
                key: FormatMessage.string({id: `${modalData.uniqueKeyNamePath}`})
              }
            })});
        } else {
          const refName = modalData.refName;
          let tempDataSource = {...dataSource};
          if (refName) {
            // modal
            tempDataSource = {
              ...tempDataSource,
              viewGroups: data.group?.length > 0 ? (dataSource?.viewGroups || []).map((v) => {
                if (data.group.includes(v.id)) {
                  return {
                    ...v,
                    [refName]: v?.[refName]?.concat(modalData.empty.id),
                  }
                }
                return v;
              }) : (dataSource?.viewGroups || []),
            }
          }
          const getData = () => {
            return {
              ...modalData.empty,
              ...(modalData.dataPick === 'all' ? _.omit(data, 'group') : _.pick(data, modalData.dataPick)),
            };
          };
          if (realType === 'dataTypeMapping') {
            tempDataSource = {
              ...tempDataSource,
              [realType]: {
                ...(dataSource?.[realType] || {}),
                mappings: (dataSource?.[realType]?.mappings || []).concat(getData())
              }
            };
          } else if (realType === 'dataTypeSupports') {
            const newData = getData();
            tempDataSource = {
              ...tempDataSource,
              profile: {
                ...(tempDataSource?.profile || {}),
                dataTypeSupports: (tempDataSource?.profile?.dataTypeSupports || [])
                  .concat(_.pick(newData, ['defKey', 'id'])),
                default: {
                  ..._.get(tempDataSource, 'profile.default', {}),
                  db: newData.defaultDb ? newData.id :
                    _.get(tempDataSource, 'profile.default.db', newData.id),
                },
                codeTemplates: _.get(tempDataSource, 'profile.codeTemplates', []).concat({
                  applyFor: newData.id,
                  type: newData.type || 'dbDDL',
                  ...defaultTemplate[`${newData.type || 'dbDDL'}Template`].reduce((a, b) => {
                    const temp = {...a};
                    temp[b] = newData[b] || '';
                    return temp;
                  }, {})
                })
              },
            };
          } else {
            // viewGroup domains
            tempDataSource = {
              ...tempDataSource,
              [realType]: (dataSource?.[realType] || []).concat(getData()),
            };
          }
          updateDataSource && updateDataSource({...tempDataSource});
          modal && modal.close();
          Message.success({title: FormatMessage.string({id: 'optSuccess'})});
          callback && callback(realType);
        }
      }
    }
  };
  const onCancel = () => {
    modal && modal.close();
  };
  const buttons = modalData.refName === 'refViews' ? [] : [
    <Button key='onOK' onClick={onOK} type='primary'>
      <FormatMessage id='button.ok'/>
    </Button>,
    <Button key='onCancel' onClick={onCancel}>
      <FormatMessage id='button.cancel'/>
    </Button>,
  ];
  const Com = modalData.component;
  modal = openModal(
    <Com {...commonProps} data={data} onOK={onOK} onCancel={onCancel}/>,
    {
      bodyStyle: realType === 'dataTypeSupports' ? {width: '80%'} : {},
      title: title || modalData.title,
      buttons,
      focusFirst: realType !== 'views',
      onEnter: () => {
        modalData.refName !== 'refViews' && onOK();
      }
    }
  )
};

const editOpt = (dataSource, menu, updateDataSource) => {
  // 暂时只有关系图和分组可以进行右键编辑 后续可以基于此进行拓展
  // 数据域 双击将触发此处的编辑方法
  const { dataType, dataKey } = menu;
  let title = '';
  let name = '';
  let keyName = 'defKey';
  let pickGroup = false;
  const getData = () => {
    if (dataType === 'diagram') {
      pickGroup = true;
      name = 'diagrams';
      title = FormatMessage.string({id: 'menus.edit.editRelation'});
      const group = (dataSource?.viewGroups || [])
        .filter(v => v?.refDiagrams?.includes(dataKey))
        .map(v => v.id) || [];
      return {
        ...(dataSource?.diagrams || []).filter(d => d.id === dataKey)[0] || {},
        group,
      };
    } else if (dataType === 'groups') {
      name = 'viewGroups';
      title = FormatMessage.string({id: 'menus.edit.editGroup'});
      return _.get(dataSource, name, []).filter(v => v.id === dataKey)[0] || {};
    } else if (dataType === 'domain') {
      name = 'domains';
      title = FormatMessage.string({id: 'menus.edit.editDomain'});
      return _.get(dataSource, name, []).filter(v => v.id === dataKey)[0] || {};
    } else if (dataType === 'mapping') {
      name = 'dataTypeMapping.mappings';
      title = FormatMessage.string({id: 'menus.edit.editMapping'});
      return _.get(dataSource, name, []).filter(v => v.id === dataKey)[0] || {};
    } else if (dataType === 'dataType') {
      name = 'profile.dataTypeSupports';
      title = FormatMessage.string({id: 'menus.edit.editDataTypeSupport'});
      const temp = (dataSource?.profile?.codeTemplates || [])
        .filter(t => t.applyFor === dataKey)[0] || {};
      return {
        ...temp,
        defaultDb: dataSource?.profile?.default?.db === dataKey,
        defKey: dataSource?.profile?.dataTypeSupports?.filter(d => d.id === temp.applyFor)[0]?.defKey
      };
    }
    return {};
  };
  const oldData = getData();
  addOpt(dataSource, menu, updateDataSource, oldData, title, (data, modal) => {
    const allKeys = (_.get(dataSource, name, [])).map(d => d.defKey || d);
    if ((data[keyName] !== oldData[keyName]) && allKeys.includes(data[keyName])) {
      Modal.error({title: FormatMessage.string({id: 'optFail'}),
        message: FormatMessage.string({id: 'entityAndViewUniquenessCheck'})});
    } else {
      if (dataType === 'diagram') {
        updateDataSource && updateDataSource({
          ...dataSource,
          diagrams: (dataSource?.diagrams || []).map((d) => {
            if (oldData.id === d.id) {
              return {
                ...d,
                defKey: data.defKey,
                defName: data.defName,
              }
            }
            return d;
          }),
          viewGroups: (dataSource?.viewGroups || []).map((v) => {
            let tempDiagramRefs = (v?.refDiagrams || []).filter(d => oldData.id !== d);
            if (data.group.includes(v.id)) {
              tempDiagramRefs.push(oldData.id);
            }
            return {
              ...v,
              refDiagrams: tempDiagramRefs,
            };
          }),
        });
      } else if (dataType === 'mapping') {
       // let domains = _.get(dataSource, 'domains', []);
        let tempDataSource = {
          ...dataSource,
          dataTypeMapping: {
            ...(dataSource?.dataTypeMapping || {}),
            mappings: _.get(dataSource, name, []).map((v) => {
              if (v.id === oldData.id) {
                return _.omit(data, 'group');
              }
              return v;
            })
          },
        };
        updateDataSource && updateDataSource(tempDataSource);
      } else if (dataType === 'dataType') {
        const dataTypeSupports = _.get(dataSource, 'profile.dataTypeSupports', []);
        const defaultData = _.get(dataSource, 'profile.default', {});
        let tempDataSource = {
          ...dataSource,
          profile: {
            ..._.get(dataSource, 'profile', {}),
            default: {
              ...defaultData,
              db: calcDefaultDb(data, oldData, defaultData.db),
            },
            dataTypeSupports: dataTypeSupports.map((d) => {
              if (d.id === oldData.applyFor) {
                return {
                  ...d,
                  defKey: data.defKey,
                };
              }
              return d;
            }),
            codeTemplates: _.get(dataSource, 'profile.codeTemplates', []).map((t) => {
              if (t.applyFor === oldData.applyFor) {
                return {
                  ..._.omit(t, defaultTemplate.appCodeTemplate.concat(defaultTemplate.dbDDLTemplate)),
                  type: data.type,
                  ...defaultTemplate[`${data.type}Template`].reduce((a, b) => {
                    const temp = {...a};
                    temp[b] = b in data ? data[b] : (oldData[b] || '');
                    return temp;
                  }, {}),
                }
              }
              return t;
            }),
          }
        };
        updateDataSource && updateDataSource(tempDataSource);
      } else {
        let tempDataSource = {
          ...dataSource,
          [name]: (dataSource?.[name] || []).map((v) => {
            if (v.id === oldData.id) {
              return pickGroup ? data : _.omit(data, 'group');
            }
            return v;
          }),
        };
        updateDataSource && updateDataSource(tempDataSource);
      }
      modal && modal.close();
      Message.success({title: FormatMessage.string({id: 'optSuccess'})});
    }
  });
};

const domainData = [
  {
    type: 'domain',
    parentType: 'domains',
    name: 'domains',
    key: 'id',
    emptyData: emptyDomain,
  },
  {
    type: 'mapping',
    parentType: 'dataTypeMapping',
    name: 'dataTypeMapping.mappings',
    key: 'id',
    emptyData: emptyDataType,
  },
  {
    type: 'dataType',
    parentType: 'dataTypeSupport',
    name: 'profile.dataTypeSupports',
    key: 'id',
    emptyData: emptyCodeTemplate,
  }
];

const copyOpt = (dataSource, menu, type = 'copy', cb) => {
  const { otherMenus = [], groupType, dataType } = menu;
  let tempTypeData = [];
  const checkData = [
    ['entity', 'entities'],
    ['view', 'views'],
    ['diagram', 'diagrams'],
    ['dict', 'dicts']
  ];
  const getData = (name, data) => {
    return dataSource?.[name].filter((d) => {
      return data.includes(d.id);
    })
  };
  const getResult = (data, group) => {
    const tempOtherMenus = group ? otherMenus.filter(m => m.parentKey === group) : otherMenus;
    return checkData.filter(c => c.includes(dataType)).reduce((pre, next) => {
      let name = next[1];
      if (tempOtherMenus.some(o => o.type === next[1]) && !tempOtherMenus.some(o => o.type === next[0])) {
        // 选中了父节点 复制所有的子节点
        return pre.concat(typeof data === 'function' ? data(name) : data?.[name]);
      } else {
        // 复制选中的子节点
        return pre.concat(getData(name, tempOtherMenus.filter(o => o.type === next[0]).map(o => o.key)));
      }
    }, []);
  };
  if (otherMenus.length > 0){
    // 组装各类复制数据
    // 获取各个分类所有的数据
    const domainIndex = domainData.findIndex((d) => d.type === dataType);
    if (domainIndex > -1) {
      // 数据域相关操作
      const { name, key } = domainData[domainIndex];
      const selectKey = otherMenus.filter(m => m.type === dataType).map(m => m.key);
      tempTypeData = _.get(dataSource, name, []).filter(d => selectKey.includes(d[key]));
    } else {
      if (groupType === 'modalGroup') {
        // 如果是在分组模式下
        // 先计算每个分组的数据 然后合并所有的数据
        tempTypeData = (dataSource?.viewGroups || []).reduce((a, b) => {
          return a.concat(getResult((names) => {
            return getData(names, b[`ref${names.slice(0, 1).toUpperCase() + names.slice(1)}`]);
          }, b.id));
        }, []);
      } else {
        tempTypeData = getResult(dataSource);
      }
    }
    if (cb) {
      cb({ type, data: tempTypeData });
    } else {
      Copy({ type, data: tempTypeData }, FormatMessage.string({id: `${type}Success`}));
    }
  } else {
    Message.warring({title: FormatMessage.string({id: `${type}Warring`})});
  }
};

const cutOpt = (dataSource, menu) => {
  copyOpt(dataSource, menu, 'cut')
};

const getOptConfig = (dataType) => {
  const entityConfig = {
    type: ['entities', 'entity'],
    mainKey: 'entities',
    key: 'id',
    emptyData: getEmptyEntity(),
    viewRefs: 'refEntities',
  };
  const viewConfig = {
    type: ['views', 'view'],
    mainKey: 'views',
    key: 'id',
    emptyData: getEmptyView(),
    viewRefs: 'refViews',
  };
  const diagramConfig = {
    type: ['diagrams', 'diagram'],
    mainKey: 'diagrams',
    key: 'id',
    emptyData: emptyDiagram,
    viewRefs: 'refDiagrams',
  };
  const dictConfig = {
    type: ['dicts', 'dict'],
    mainKey: 'dicts',
    key: 'id',
    emptyData: emptyDict,
    viewRefs: 'refDicts',
  };
  const domianConfig = {
    type: ['domain'],
    mainKey: 'domains',
    key: 'id',
    emptyData: emptyDomain,
  };
  const mappingConfig = {
    type: ['mapping'],
    mainKey: 'dataTypeMapping.mappings',
    key: 'id',
    emptyData: emptyDataType,
  };
  const dataTypeSupportConfig = {
    type: ['dataType'],
    mainKey: 'profile.dataTypeSupports',
    key: 'id',
    emptyData: emptyDataTypeSupport,
  };
  const optConfigMap = {
    entityConfig,
    viewConfig,
    diagramConfig,
    dictConfig,
    domianConfig,
    mappingConfig,
    dataTypeSupportConfig
  };
  return Object.keys(optConfigMap)
    .filter(config => optConfigMap[config].type.includes(dataType))
    .map(config => optConfigMap[config])[0];
};

const pasteOpt = (dataSource, menu, updateDataSource) => {
  const { dataType, parentKey } = menu;
  Paste((value) => {
    let data = {};
    try {
      data = JSON.parse(value);
      const config = getOptConfig(dataType);
      const validate = (dataType === 'mapping' || dataType === 'dataType')
        ? validateItemInclude : validateItem;
      const newData = (data?.data || []).filter(e => validate(e, config.emptyData));
      const newDataKeys = newData.map(e => e[config.key]);
      const oldData = _.get(dataSource, config.mainKey, []).filter((e) => {
        if (data?.type === 'cut') {
          return !newDataKeys.includes(e[config.key]);
        }
        return true;
      });
      const newGroupData = config.viewRefs && (dataSource?.viewGroups || []).map(v => {
        if (data?.type === 'cut') {
          return {
            ...v,
            [config.viewRefs]: (v[config.viewRefs] || []).filter(k => !newDataKeys.includes(k)),
          }
        }
        return v;
      });
      let tempCodeTemplates = [];
      const codeTemplates = (dataSource.profile.codeTemplates || []);
      const allKeys = oldData.map(e => e.defKey);
      const realData = newData
        .map((e) => {
          const key = validateKey(e.defKey, allKeys);
          allKeys.push(key);
          const id = Math.uuid();
          if (dataType === 'dataType') {
            tempCodeTemplates = tempCodeTemplates
              .concat(codeTemplates.filter(c => c.applyFor === e.id)).map(c => {
                return {
                  ...c,
                  applyFor: id,
                };
              });
          }
          return {
            ...e,
            id,
            defKey: key,
          };
        });
      if (realData.length === 0) {
        Message.warring({title: FormatMessage.string({id: 'pasteWarring'})});
      } else {
        const mainKeys = config.mainKey.split('.');
        let tempNewData = {};
        if (mainKeys.length > 1) {
          tempNewData = _.set(dataSource, mainKeys, oldData.concat(realData));
        } else {
          tempNewData[config.mainKey] = oldData.concat(realData);
        }
        if (dataType === 'dataType') {
          tempNewData.profile.codeTemplates = codeTemplates.concat(tempCodeTemplates);
        }
        if (parentKey) {
          updateDataSource({
            ...dataSource,
            ...tempNewData,
            viewGroups: newGroupData ? newGroupData.map((v) => {
              if (v.id === parentKey) {
                return {
                  ...v,
                  [config.viewRefs]: (v[config.viewRefs] || []).concat(realData.map(e => e[config.key])),
                }
              }
              return v;
            }) : (dataSource.viewGroups || [])
          });
        } else {
          updateDataSource({
            ...dataSource,
            ...tempNewData,
            viewGroups: newGroupData ? newGroupData : (dataSource.viewGroups || []),
          });
        }
        Message.success({title: FormatMessage.string({id: 'pasteSuccess'})});
      }
    } catch (e) {
      Message.warring({title: FormatMessage.string({id: 'pasteWarring'})});
    }
  });
};

const deleteOpt = (dataSource, menu, updateDataSource, tabClose) => {
  Modal.confirm({
    title: FormatMessage.string({id: 'deleteConfirmTitle'}),
    message: FormatMessage.string({id: 'deleteConfirm'}),
    onOk: () => {
      const { dataType, dataKey, otherMenus = [] } = menu;
      const domain = domainData.filter(d => d.type === dataType)[0];
      if (dataType === 'groups') {
        updateDataSource && updateDataSource({
          ...dataSource,
          viewGroups: (dataSource?.viewGroups || []).filter(v => v.id !== dataKey),
        });
        Message.success({title: FormatMessage.string({id: 'deleteSuccess'})});
      } else if (domain && domain.type === 'mapping') {
        const deleteData = otherMenus.filter(m => m.type === dataType).map(m => m.key);
        updateDataSource && updateDataSource({
          ...dataSource,
          dataTypeMapping: {
            ...dataSource.dataTypeMapping,
            mappings: (dataSource.dataTypeMapping?.mappings || [])
                .filter(d => !deleteData.includes(d.id))
          }
        });
        Message.success({title: FormatMessage.string({id: 'deleteSuccess'})});
      } else if(domain && domain.type === 'dataType') {
        const deleteData = otherMenus.filter(m => m.type === dataType).map(m => m.key);
        const dataTypeSupports = (dataSource.profile?.dataTypeSupports || [])
          .filter(d => !deleteData.includes(d.id));
        const db = _.get(dataSource, 'profile.default.db');
        updateDataSource && updateDataSource({
          ...dataSource,
          profile: {
            ...dataSource.profile,
            default: {
              ...dataSource.profile.default,
              db: !dataTypeSupports.map(d => d.id).includes(db) ? (dataTypeSupports[0]?.id || '') : db,
            },
            dataTypeSupports,
            codeTemplates: (dataSource.profile?.codeTemplates || [])
                .filter(d => !deleteData.includes(d.applyFor))
          }
        });
        Message.success({title: FormatMessage.string({id: 'deleteSuccess'})});
      } else {
        const optConfig = getOptConfig(dataType);
        if (optConfig) {
          copyOpt(dataSource, menu, 'delete', (data) => {
            const deleteData = (data?.data || []);
            const deleteDataKeys = deleteData.map(e => e[optConfig.key]);
            const newData = (dataSource?.[optConfig.mainKey] || [])
              .filter(e => !deleteDataKeys.includes(e[optConfig.key]));
            const newGroupData = (dataSource?.viewGroups || []).map(v => ({
              ...v,
              [optConfig.viewRefs]: (v[optConfig.viewRefs] || []).filter(k => !deleteDataKeys.includes(k)),
            }));
            const tempDataSource = {
              ...dataSource,
              viewGroups: newGroupData,
              [optConfig.mainKey]: newData,
            };
            updateDataSource && updateDataSource({
              ...tempDataSource,
              views: optConfig.mainKey === 'entities' ? (tempDataSource.views || []).map(v => {
                // 需要移除视图内与该数据表有关的内容
                if (v.refEntities?.some(ref => deleteDataKeys.includes(ref))) {
                  return {
                    ...v,
                    refEntities: v.refEntities?.filter(ref => !deleteDataKeys.includes(ref)),
                    fields: v.fields?.map(f => {
                      if (deleteDataKeys.includes(f.refEntity)) {
                        return _.omit(f, ['refEntity', 'refEntityField']);
                      }
                      return f;
                    })
                  };
                }
                return v;
              }) : tempDataSource.views,
            });
            tabClose && tabClose(deleteDataKeys.map(d => d + separator + optConfig.type[1]));
            Message.success({title: FormatMessage.string({id: 'deleteSuccess'})});
          });
        }
      }
    },
  });
};

const clearOpt = (dataSource, menu, updateDataSource) => {
  const { dataKey, dataType } = menu;
  Modal.confirm({
    title: FormatMessage.string({id: 'clearConfirmTitle'}),
    message: FormatMessage.string({id: 'clearConfirm'}),
    onOk: () => {
      const domain = domainData.filter(d => d.parentType === dataType)[0];
      // 数据域相关操作
      if (domain) {
        if (dataType === 'dataTypeMapping') {
          updateDataSource && updateDataSource({
            ...dataSource,
            dataTypeMapping: {
              referURL: '',
              mappings: [],
            },
          });
        } else if (dataType === 'domains') {
          updateDataSource && updateDataSource({
            ...dataSource,
            domains: [],
          });
        } else if (dataType === 'dataTypeSupport') {
          updateDataSource && updateDataSource({
            ...dataSource,
            profile: {
              ...dataSource.profile,
              dataTypeSupports: [],
              codeTemplates: (dataSource?.profile?.codeTemplates || []).filter(c => {
                return c.applyFor === 'dictSQLTemplate';
              }),
            },
          });
        }
      } else {
        updateDataSource && updateDataSource({
          ...dataSource,
          viewGroups: (dataSource?.viewGroups || []).map((v) => {
            if (v.id === dataKey) {
              return {
                ...v,
                refEntities:[],
                refViews:[],
                refDiagrams:[],
                refDicts:[]
              }
            }
            return v;
          }),
        });
      }
      Message.success({title: FormatMessage.string({id: 'clearSuccess'})});
    }
  });
};

const moveOpt = (dataSource, menu, updateDataSource) => {
  const { dataType, dataKey, otherMenus } = menu;
  let modal = null;
  const getRefName = (type) => {
    switch (type) {
      case 'entity': return 'refEntities';
      case 'view': return 'refViews';
      case 'diagram': return 'refDiagrams';
      case 'dict': return 'refDicts';
    }
  };
  const refName = getRefName(dataType);
  let oldData = (dataSource?.viewGroups || []).filter(v => v[refName]?.includes(dataKey)).map(v => v.id);
  const allGroupData = otherMenus.reduce((a, b) => {
    const tempA = {...a};
    const type = getRefName(b.type);
    if (!tempA[type]) {
      tempA[type] = [];
    }
    tempA[type].push(b.key);
    return tempA;
  }, {});
  console.log(allGroupData);
  const dataChange = (groups) => {
    oldData = groups;
  };
  const onCancel = () => {
    modal && modal.close();
  };
  const onOK = () => {
    const selectGroups = [...new Set(oldData)];
    updateDataSource && updateDataSource({
      ...dataSource,
      viewGroups: (dataSource?.viewGroups || []).map((v) => {
        if (selectGroups.includes(v.id)) {
          return {
            ...v,
            ...Object.keys(allGroupData).reduce((a, b) => {
              const tempA = {...a};
              tempA[b] = [...new Set((v[b] || []).concat(allGroupData[b]))];
              return tempA;
            },{}),
          }
        } else {
          return {
            ...v,
            ...Object.keys(allGroupData).reduce((a, b) => {
              const tempA = {...a};
              tempA[b] = (v[b] || []).filter(k => !allGroupData[b].includes(k));
              return tempA;
            },{}),
          }
        }
      }),
    });
    Message.success({title: FormatMessage.string({id: 'moveSuccess'})});
    modal && modal.close();
  };
  modal = openModal(
    <SelectGroup dataSource={dataSource} dataChange={dataChange} data={oldData}/>,
    {
      title: FormatMessage.string({id: 'group.selectGroup'}),
      buttons: [
        <Button type='primary' key='onOK' onClick={onOK}>
          <FormatMessage id='button.ok'/>
        </Button>,
        <Button key='onCancel' onClick={onCancel}>
          <FormatMessage id='button.cancel'/>
        </Button>],
    }
  )
};
