import React from 'react';
import * as _ from 'lodash/object';
import moment from 'moment';
import { FormatMessage } from 'components';
import {getAllTabData, setDataByTabId, clearAllTabData, getDataByTabId, getMemoryCache} from './cache';
import emptyProjectTemplate from './emptyProjectTemplate';
import { separator } from '../../profile';
import {firstUp} from './string';
import {compareVersion} from './update';

export const allType = [
  { type: 'entity', name: 'entities', defKey: 'defKey' },
  { type: 'view', name: 'views', defKey: 'defKey' },
  { type: 'diagram', name: 'diagrams', defKey: 'defKey' },
  { type: 'dict', name: 'dicts', defKey: 'defKey' },
  { type: 'domain', name: 'domains', defKey: 'defKey' },
  { type: 'mapping', name: 'dataTypeMapping.mappings', defKey: 'defKey' },
];

export const filterEdge = (allNodes, c) => {
  return allNodes.filter((n) => {
    if (n.id === c.source?.cell) {
      return n.ports?.items?.findIndex(i => i.id === c.source?.port) >= 0;
    } else if (n.id === c.target?.cell) {
      return n.ports?.items?.findIndex(i => i.id === c.target?.port) >= 0;
    }
    return false;
  }).length === 2
};

export const updateAllData = (dataSource, tabs, openConfig) => {
  // 整理项目中所有的关系图数据 去除无效的关系图数据
  let tempData = {...dataSource};
  const allTabData = getAllTabData();
  let message = '';
  let flag = false;
  // 需要校验数据表是否有重复字段
  // 需要校验数据表展示在关系图上的字段是否超过限制
  let sizeError = [];
  let repeatError = [];
  let entityRepeatError = [];
  let currentDefKey = {
    entity: [],
    view: [],
  };
  const size = _.get(dataSource, 'profile.relationFieldSize', 15);
  tabs.map(t => {
    const typeName = allType.filter(all => t.type === all.type)[0]?.name;
    const oldData = tempData[typeName].filter(e => e.id === t.tabKey.split(separator)[0])[0];
    return {
      type: t.type,
      key: t.tabKey,
      oldData,
      data: getDataByTabId(t.tabKey)?.data || oldData || {}
    }
  }).forEach(t => {
    if (!t.data.defKey && t.type !== 'diagram') {
      message = FormatMessage.string({
        id: 'defKeyValidateMessage',
        data: {
          name: `${FormatMessage.string({id: `menus.${t.type}`})}[${t.oldData.defName || t.oldData.defKey}]`,
        }});
    }
    if (t.type === 'entity' || t.type === 'view') {
      const keys = (t.data?.fields || []).map(f => f.defKey);
      if(!(t.data.fields.filter(f => !f.hideInGraph).length <= size)) {
        sizeError.push(t.data.defKey);
      }
      if (keys.filter(k => !!k).length !== new Set(keys).size) {
        const fields = t.data?.fields || [];
        const repeat = fields.reduce((a, b) => {
          if (fields.filter(f => f.defKey === b.defKey).length > 1 && !a.includes(b.defKey)) {
            return a.concat(b.defKey || FormatMessage.string({id: 'emptyField'}));
          }
          return a;
        }, []).join('|');
        repeatError.push(`${t.data.defKey}=>[${repeat}]`);
      }
      // 判断数据表或者视图重复
      const newDefKey = t.data?.defKey;
      if (newDefKey !== t.oldData?.defKey) {
        // 不能跟当前打开的TAB的key重复
        // 不能跟已经存在的key重复
        if (!currentDefKey[t.type].includes(newDefKey)) {
          currentDefKey[t.type].push(newDefKey);
        } else {
          entityRepeatError.push(newDefKey);
        }
        if (dataSource[t.type === 'view' ? 'views' : 'entities']?.filter(e => e.defKey === newDefKey).length > 0) {
          entityRepeatError.push(newDefKey);
        }
      }
    }
  })
  if (entityRepeatError.length > 0) {
    message += FormatMessage.string({
      id: 'entityUniqueDefKeyError',
      data: {
        size,
        entities: entityRepeatError.join(','),
      }}) + ';';
  }
  if (sizeError.length > 0) {
    // 字段关系图显示超限
    message += FormatMessage.string({
      id: 'entityHideInGraphSizeError',
      data: {
          size,
          entities: sizeError.join(','),
      }});
    message = <div>{message}<a onClick={openConfig}>[{FormatMessage.string({id: 'modify'})}]</a></div>;
  }
  if (repeatError.length > 0) {
    // 字段重复显示超限
    message += FormatMessage.string({
      id: 'entityUniqueKeyError',
      data: {
        entities: repeatError.join(','),
      }
    });
  }
  if (!message) {
    const getData = () => {
      return Object.keys(allTabData).reduce((pre, next) => {
        const tempPre = {...pre};
        if (allTabData[next]) {
          const type = allTabData[next].type;
          if (!tempPre[type]) {
            tempPre[type] = [];
          }
          tempPre[type].push({...allTabData[next].data});
        }
        return tempPre;
      }, {});
    };
    const tabsAllData = getData();
    let viewGroups = dataSource?.viewGroups;
    allType.forEach((type) => {
      if (tabsAllData[type.type] && tabsAllData[type.type].length > 0) {
        flag = true;
        tempData = {
          ...tempData,
          [type.name]: _.get(tempData, type.name, []).map((d) => {
            const currentData = tabsAllData[type.type].filter(t => t.id === d.id)[0];
            if (currentData) {
              if (type.type === 'diagram') {
                const allNodes = currentData?.cells || [];
                return {
                  ...d,
                  canvasData: {
                    cells: allNodes.map(c => {
                      if (c.shape === 'erdRelation') {
                        if (filterEdge(allNodes, c)) {
                          return c;
                        }
                        return null;
                      }
                      return c;
                    }).filter(c => !!c).map(c => {
                      const otherData = {};
                      const pickFields = [
                        'id',
                        'shape',
                        'source',
                        'target',
                        'position',
                        'count',
                        'originKey',
                        'relation',
                        'vertices',
                        'label',
                        'labels',
                        'fontColor',
                        'fillColor',
                        'parent',
                        'router'
                      ];
                      if (c.shape === 'edit-node' || c.shape === 'edit-node-circle'
                        || c.shape === 'edit-node-polygon'
                        || c.shape === 'edit-node-circle-svg') {
                        pickFields.push('size');
                        pickFields.push('ports');
                      } else if (c.shape === 'group') {
                        pickFields.push('size');
                        pickFields.push('children');
                      }
                      if (d.relationType === 'entity') {
                        pickFields.push('ports');
                      }
                      if (c.shape === 'edit-node-polygon' || c.shape === 'edit-node-circle-svg') {
                        otherData.label = c.label || c?.attrs?.text?.text || '';
                      }
                      return {
                        ..._.pick(c, pickFields),
                        ...otherData,
                      };
                    }),
                  },
                };
              }
              if (currentData.group) {
                // 如果包含分组的修改
                viewGroups = viewGroups.map((g) => {
                  const tempRefs = (g?.[`ref${firstUp(type.name)}`] || [])
                      .filter((key) => key !== currentData.id);
                  if (currentData.group.includes(g.id)) {
                    tempRefs.push(d.id);
                  }
                  return {
                    ...g,
                    [`ref${firstUp(type.name)}`]: tempRefs,
                  };
                });
              }
              return currentData;
            }
            return d;
          }),
        }
      }
    });
    if (flag) {
      return {
        dataSource: updateAllEntity({
          ...tempData,
          viewGroups,
        }, tabsAllData?.diagram || []),
        result: {
          status: true,
        },
      };
    }
    return {
      dataSource,
      result: {
        status: true,
      },
    };
  }
  return { result: { status: false, message } };
};

const updateAllEntity = (dataSource, diagrams) => {
  const calcCorrelations = () => {
    return (diagrams || []).reduce((a, b) => {
      const cells = b?.cells || [];
      const allTable = cells.filter(c => c.shape === 'table');
      return a.concat(cells.filter(c => c.shape === 'erdRelation').map(cell => {
        const sourceId = _.get(cell, 'source.cell', '');
        const targetId = _.get(cell, 'target.cell', '');
        const relation = (cell.relation || '').split(':');
        const status = relation[0]?.includes('n');
        const myEntity = allTable
          .filter(t => t.id === (status ? sourceId : targetId))[0]?.originKey;
        const refEntity = allTable
          .filter(t => t.id === (status ? targetId : sourceId))[0]?.originKey;
        if (myEntity && refEntity) {
          return {
            myEntity,
            myField: _.get(cell, status ? 'source.port' : 'target.port', '')
              .split(separator)[0],
            refEntity,
            refField: _.get(cell, status ? 'target.port' : 'source.port', '')
              .split(separator)[0],
            myRows: (status ? relation[0] : relation[1]) || '',
            refRows: (status ? relation[1] : relation[0]) || '',
            innerType: '',
          }
        }
        return null;
      }).filter(c => !!c));
    }, []);
  };
  const correlations = calcCorrelations();
  return {
    ...dataSource,
    entities: (dataSource.entities || []).map(e => {
      const current = correlations
        .filter(c => c.myEntity === e.id)
        .map(c => _.omit(c, 'myEntity'));
      if (current) {
        return {
          ...e,
          correlations: current,
        }
      }
      return e;
    })
  };
};

export const importFields = (entities, fields, data, useDefaultFields, onlyEntityFields) => {
  const allFields = [...(data?.fields || [])].filter(f => !f.refEntity); // 过滤掉从实体中获取的
  if (useDefaultFields) {
    allFields.push(...emptyProjectTemplate.profile.default.entityInitFields
      .map(f => ({...f, id: Math.uuid()})));
  }
  const allFieldKeys = allFields.map(f => f.defKey);
  const newFields = fields.map((v) => {
    const splitArray = v.split(separator);
    const entity = splitArray[0];
    const field = splitArray[1];
    const tempEntity = entities?.filter(e => e.id === entity)[0] || {};
    const tempField = tempEntity?.fields?.filter(f => f.id === field)[0] || {};
    const tempKey = validateKey(tempField.defKey, allFieldKeys);
    allFieldKeys.push({defKey: tempKey});
    return {
      ...tempField,
      id: Math.uuid(),
      defKey: tempKey,
      refEntity: entity,
      refEntityField: field,
    };
  });
  return onlyEntityFields ? newFields : newFields.concat(allFields);
};

export const validateKey = (key, fields) => {
  // 校验字段名是否重复 自动进行数字递增
  const keys = fields.map(f => f.defKey || f);
  if (keys.includes(key)) {
    // 1.判断是否有数字结尾
    const matchData = key.match(/(\d+)$/);
    if (!matchData) {
      return validateKey(`${key}1`, fields);
    }
    return validateKey(`${key.split(matchData[0])[0]}${(parseInt(matchData[0], 10) + 1)}`, fields);
  }
  return key;
};

export const getDemoDbConnect = () => {
  return {
    mysql: {
      defKey: 'MySQL',
      url: FormatMessage.string({id: 'dbConnect.demoDbConnect.mysql'}),
      driverClass: 'com.mysql.cj.jdbc.Driver',
    },
    oracle: {
      defKey: 'ORACLE',
      url: FormatMessage.string({id: 'dbConnect.demoDbConnect.oracle'}),
      driverClass: 'oracle.jdbc.driver.OracleDriver',
    },
    sqlserver: {
      defKey: 'SQLServer',
      url: FormatMessage.string({id: 'dbConnect.demoDbConnect.sqlserver'}),
      driverClass: 'com.microsoft.sqlserver.jdbc.SQLServerDriver',
    },
    postgresql: {
      defKey: 'PostgreSQL',
      url: FormatMessage.string({id: 'dbConnect.demoDbConnect.postgresql'}),
      driverClass: 'org.postgresql.Driver',
    },
    db2: {
      defKey: 'DB2',
      url: FormatMessage.string({id: 'dbConnect.demoDbConnect.db2'}),
      driverClass: 'com.ibm.db2.jcc.DB2Driver',
    },
    dm: {
      defKey: 'DM(达梦)',
      url: FormatMessage.string({id: 'dbConnect.demoDbConnect.dm'}),
      driverClass: 'dm.jdbc.driver.DmDriver',
    },
    gaussdb: {
      defKey: 'GuassDB',
      driverClass: 'org.postgresql.Driver',
      url: FormatMessage.string({id: 'dbConnect.demoDbConnect.guassdb'}),
    },
    kingbase: {
      defKey: 'Kingbase(人大金仓)',
      driverClass: 'com.kingbase8.Driver',
      url: FormatMessage.string({id: 'dbConnect.demoDbConnect.kingbase'}),
    },
    maxcompute: {
      defKey: 'MaxCompute',
      driverClass: 'com.aliyun.odps.jdbc.OdpsDriver',
      url: FormatMessage.string({id: 'dbConnect.demoDbConnect.maxcompute'}),
    },
    sqlite: {
      defKey: 'SQLite',
      driverClass: 'org.sqlite.JDBC',
      url: FormatMessage.string({id: 'dbConnect.demoDbConnect.sqlite'}),
    }
  }
};

export const emptyDbConn = {
  defKey: '',
  defName: '',
  type: '',
  properties: {
    driver_class_name: '',
    url: '',
    username: '',
    password: '',
  }
};

export const emptyField = {
  defKey: '',
  defName: '',
  comment: '',
  type: '',
  len: '',
  scale: '',
  primaryKey: false,
  notNull: false,
  autoIncrement: false,
  defaultValue: '',
  hideInGraph: false,
  refDict: '',
};

export const emptyIndex = {
  defKey: '',
  defName: null,
  unique: false,
  comment: '',
  fields: [],
};

export const emptyStandardGroup = {
  defKey: '',
  defName: '',
  fields: [],
};

export const emptyDomain = {
  defKey: '',
  defName: '',
  applyFor: '',
  len: '',
  scale: '',
  uiHint: '',
  id: ''
};

export const emptyDataType = {
  defKey: '',
  defName: '',
};

export const emptyDataTypeSupport = {
  defKey: '',
}

export const emptyCodeTemplate = {
  applyFor: '',
  type: '',
};

export const emptyDict = {
  defKey: '',
  defName: '',
  sort: '',
  intro: '',
  id: '',
  items: [],
};

export const emptyDictItem = {
  defKey: '',
  defName: '',
  sort: '',
  parentKey: '',
  intro: '',
  enabled: true,
  attr1: '',
  attr2: '',
  attr3: ''
};

export const emptyRelation = {
  defKey: '',
  defName: '',
  relationType: 'field',
  canvasData: {}
};

export const validateStandardFields = (data) => {
  // 分组名或字段名不能为空或重复
  const groupKeys = data.map(d => d.defKey);
  const fields = data.reduce((a, b) => a.concat(b.fields), []);
  const fieldKeys = fields.map(d => d.defKey);
  return (groupKeys.length === new Set(groupKeys).size)
      && (groupKeys.length === groupKeys.filter(g => !!g).length)
      && (fieldKeys.length === new Set(fieldKeys).size)
      && (fieldKeys.length === fieldKeys.filter(g => !!g).length);
}

export const validateDictBase = (dict) => {
  const items = (dict.items || []).map(d => d.defKey);
  return dict.defKey && (items.length === new Set(items).size)
      && (items.length === items.filter(i => !!i).length)
};

export const validate = (items, emptyObj, name) => {
  // 校验数据否符合规范
  const fieldNames = Object.keys(emptyObj);
  if (!items.some(i => Object.keys(i).some(n => !fieldNames.includes(n)))) {
    return items;
  }
  throw Error(`invalid${name}`);
};

export const validateItemInclude = (item, empty) => {
  const fieldNames = Object.keys(empty);
  const itemNames = Object.keys(item);
  return fieldNames.every(f => itemNames.includes(f));
};

export const validateItem = (item, empty) => {
  const fieldNames = Object.keys(empty);
  return !Object.keys(item)
    .some(n => !fieldNames.includes(n));
};

export const validateIndexes = (indexes) => {
  // 校验索引是否符合规范
  const fieldNames = Object.keys(emptyIndex);
  const nameResult = indexes.some(f => Object.keys(f).some(n => !fieldNames.includes(n)));
  if (!nameResult) {
    return indexes.map(i => ({
      defName: i?.defName || null,
      isUnique: i?.isUnique || false,
      fields: i?.fields || [],
    }));
  }
  throw Error('invalidIndexes');
};

export const validateFields = (fields) => {
  // 校验字段是否符合规范
  return fields.filter(f => f.defKey).map(f => ({
    defKey: f?.defKey || f?.name || '',
    defName: f?.defName || f?.chnname || '',
    comment: f?.comment || f?.remark || '',
    type: f?.type,
    len: f?.len || '',
    scale: f?.scale || '',
    primaryKey: f?.primaryKey || f?.pk || false,
    notNull: f?.notNull || false,
    autoIncrement: f?.autoIncrement || false,
    defaultValue: f?.defaultValue || '',
    hideInGraph: f?.hideInGraph || f?.relationNoShow || false,
    domain: f?.domain || f?.dbType,
  }))
};

export const getEntityOrViewByName = (dataSource, name) => {
  const entity = (dataSource?.entities || []).filter(e => e.id === name)[0];
  if (!entity) {
    return (dataSource?.views || []).filter(e => e.id === name)[0];
  }
  return entity;
};

export const getProjectName = (path = '', separator) => {
  // 1.不同的操作系统文件名的分隔符不同 此处需要统一转化为'\'
  const realPath = path.replace('/', '\\');
  const paths = realPath.split('\\');
  return paths[paths.length - 1].split(separator)[0];
};

const fieldsTransform = (f, domains, mapping, db) => {
  const data = domains.filter(d => d.defKey === f.type)[0] || {};
  const realType = ((mapping || []).filter(d => d.defKey === data.applyFor)[0] || {})[db];
  return {
    defKey: f?.name || '',
    defName: f?.chnname || '',
    comment: f?.remark || '',
    domain: f?.type || '',
    type: realType || '',
    len: data?.len || '',
    scale: data?.scale || '',
    primaryKey: f?.pk || false,
    notNull: f?.notNull || false,
    autoIncrement: f?.autoIncrement || false,
    defaultValue: f?.defaultValue || '',
    hideInGraph: f?.relationNoShow || false,
  };
};

const indexesTransform = (i) => {
  return {
    defKey : i.name,
    unique : i.isUnique,
    defName : null,
    comment : "",
    fields : (i.fields || []).map(f => {
      return {
        ascOrDesc: 'A',
        fieldDefKey: f
      }
    }),
  }
}

export const getColumnWidth = () => {
  return {
    refEntity: 100,
    refDict: 250,
    hideInGraph: 80,
    defKey: 200,
    defName: 200,
    primaryKey: 70,
    notNull: 90,
    autoIncrement: 70,
    domain: 110,
    type: 100,
    len: 70,
    scale: 100,
    comment: 300,
    defaultValue: 200,
    isStandard: 100,
    intro: 200,
    uiHint: 100,
  };
};

export const getStandardGroupColumns = () => {
  return [
    {
      refKey: 'defKey',
      value: FormatMessage.string({id: 'standardFields.groupCode'}),
      com: 'Input',
    },
    {
      refKey: 'defName',
      value: FormatMessage.string({id: 'standardFields.groupName'}),
      com: 'Input',
    }
  ]
};

export const getFullColumns = () => {
  return [
    {code: 'relationNoShow', value: FormatMessage.string({id: 'tableHeaders.hideInGraph'}), newCode: 'hideInGraph', com: 'Icon', relationNoShow: true},
    {code: 'name', value: FormatMessage.string({id: 'tableHeaders.defKey'}), newCode: 'defKey', com: 'Input', relationNoShow: false},
    {code: 'chnname', value: FormatMessage.string({id: 'tableHeaders.defName'}), newCode: 'defName', com: 'Input', relationNoShow: false},
    {code: 'pk', value: FormatMessage.string({id: 'tableHeaders.primaryKey'}), newCode: 'primaryKey', com: 'Checkbox', relationNoShow: false},
    {code: 'notNull', value: FormatMessage.string({id: 'tableHeaders.notNull'}), newCode: 'notNull', com: 'Checkbox', relationNoShow: true},
    {code: 'autoIncrement', value: FormatMessage.string({id: 'tableHeaders.autoIncrement'}), newCode: 'autoIncrement', com: 'Checkbox', relationNoShow: true},
    {code: 'type', value: FormatMessage.string({id: 'tableHeaders.domain'}), newCode: 'domain', com: 'Select', relationNoShow: true},
    {code: 'dataType', value: FormatMessage.string({id: 'tableHeaders.dbType'}), newCode: 'type', com: 'Text', relationNoShow: false},
    {code: 'len', value: FormatMessage.string({id: 'tableHeaders.len'}), newCode: 'len', com: 'Input', relationNoShow: false},
    {code: 'scale', value: FormatMessage.string({id: 'tableHeaders.scale'}), newCode: 'scale', com: 'Input', relationNoShow: false},
    {code: 'remark', value: FormatMessage.string({id: 'tableHeaders.remark'}), newCode: 'comment', com: 'Input', relationNoShow: true},
    {code: 'refDict', value: FormatMessage.string({id: 'tableHeaders.refDict'}), newCode: 'refDict', com: 'SearchSelect', relationNoShow: true},
    {code: 'defaultValue', value: FormatMessage.string({id: 'tableHeaders.defaultValue'}), newCode: 'defaultValue', com: 'Input', relationNoShow: true},
    {code: 'isStandard', value: FormatMessage.string({id: 'standardFields.isStandard'}), newCode: 'isStandard',com: 'label', relationNoShow: false},
    {code: 'uiHint', value: FormatMessage.string({id: 'tableHeaders.uiHint'}), newCode: 'uiHint',com: 'Select', relationNoShow: true}
  ]; // 完整的头部信息
};

export const getViewColumn = () => {
  const headers = getFullColumns();
  headers.splice(2, 0, {code: 'refEntity', value: FormatMessage.string({id: 'tableHeaders.refEntity'}), newCode: 'refEntity', com: 'label', relationNoShow: true});
  return headers;
}

export const getEmptyEntity = (fields = [], properties = {}) => {
  return {
    id: Math.uuid(),
    defKey: '',
    defName: '',
    comment: '',
    properties,
    nameTemplate: '{defKey}[{defName}]',
    headers: getFullColumns()
      .map(h => ({
        freeze: !!(h.newCode === 'defKey' ||  h.newCode === 'defName'),
        refKey: h.newCode,
        hideInGraph: h.relationNoShow,
      })),
    fields,
    correlations: [],
    indexes: [],
  };
};

export const emptyGroup = {
  defKey: '',
  defName: '',
  refEntities:[],
  refViews:[],
  refDiagrams:[],
  refDicts:[]
};

export const getEmptyView = () => {
  return {
    ...getEmptyEntity(),
    headers: getViewColumn()
    .map(h => ({
      refKey: h.newCode,
      hideInGraph: h.relationNoShow,
    })),
    refEntities: [],
  }
};

export const emptyDiagram = {
  defKey: '',
  defName: '',
  id: '',
  relationType: 'field',
  canvasData: {}
};

export const defaultTemplate = {
  dbDDLTemplate: ['createTable', 'createIndex', 'createView'],
  appCodeTemplate: ['content'],
};

export const version2sino = (versionData, projectData) => {
  // 版本数据目前只保留实体数据的内容
  if (!versionData.modules) {
    return versionData;
  }
  const domains = projectData.domains || [];
  const mapping = projectData?.dataTypeMapping?.mappings || [];
  const db = projectData?.profile?.default?.db || '';
  return {
    ..._.omit(versionData, ['modules']),
    entities: _.get(versionData, 'modules', []).reduce((a, b) => a.concat(b.entities), []).map(e => ({
      defKey: e.title || '',
      defName: e.chnname || '',
      comment: e.remark || '',
      fields: _.get(e, 'fields', []).map(f => fieldsTransform(f, domains, mapping, db)),
      indexes: _.get(e, 'indexs', []).map(i => indexesTransform(i)),
    }))
  }
};

export const pdman2sino = (data, projectName) => {
  if (!data.modules) {
    //return data;
  }
  moment().local();
  const entities = _.get(data, 'modules', []).reduce((a, b) => a.concat(b.entities), [])
  const defaultDb = _.get(data, 'profile.dbs', []).filter(d => d.defaultDB)[0] || {};
  const mappings = _.get(emptyProjectTemplate, 'dataTypeMapping.mappings', []); // 使用默认的mappings
  const defaultDomains = _.get(emptyProjectTemplate, 'domains', []); // 使用默认的domains
  const domains = defaultDomains.concat(_.get(data, 'dataTypeDomains.datatype', []).map(d => {
    // 从已知的数据域中寻找包含数字的数据类型（为了保证最大的兼容性）
    // 判断是否存在反之则需要创建新的
    if (defaultDomains.findIndex(defaultD => defaultD.defKey === d.code) < 0) {
      // 如果默认的domains中没有
      const apply = d.apply || {};
      const applyArray = Object.keys(apply);
      const javaIndex = applyArray.findIndex(p => p.toLocaleLowerCase() === 'java');
      // 取java的mapping或者第一个
      const applyFor = (apply[applyArray[javaIndex]]
        || apply[applyArray[0]] || {})?.type?.toLocaleLowerCase()?.replace(/\(\d+,*\d*\)/g, '');
      if (!applyFor) {
        // 不存在任何的domain 无效的dataType
        return null;
      }
      // 判断mapping是否已经存在
      if (mappings.findIndex(map => map.defKey === applyFor) < 0) {
        // 需要增加
        mappings.push({
          defKey: applyFor,
          defName: `${d.name || applyFor}`,
          ...(applyArray.reduce((a, b) => {
            a[b] = (apply[b]?.type || '').replace(/\(\d+,*\d*\)/g, '');
            return a;
          }, {}))
        });
      }
      const data = applyArray.filter(p => /(\d+,*\d*)/g.test(apply[p]?.type || '')).map(p => {
        const length = (apply[p]?.type?.match(/(\d+,*\d*)/g)[0] || '0').split(',').map(l => parseInt(l, 10));
        return {
          len: length[0] || '',
          scale: length[1] || ''
        }
      })[0] || {
        len: '',
        scale: ''
      };
      return {
        defKey: d.code || '',
        defName: `${d.name || ''}_${d.code}`,
        applyFor: applyFor,
        len: data.len,
        scale: data.scale
      }
    }
    return null;
  }).filter(d => !!d));
  /*
  *
  *
  *
  * */
  const calcId = (anchorIndex, nodeId, nodes) => {
    const index = parseInt((anchorIndex / 2), 10);
    const node = nodes.filter(n => n.id === nodeId)[0];
    const tabName = node?.title.split(':')[0];
    const table = entities.filter(t => t.title === tabName)[0];
    const field = table?.fields[index] || '';
    return `${field.name}${separator}${anchorIndex % 2 === 0 ? 'in' : 'out'}`;
  };
  const diagrams = data?.modules?.reduce((a, b) => a.concat({
        defKey: `${b.name}-GRAPH-CANVAS`,
        defName: `${b.chnname || b.name}-${FormatMessage.string({id: 'relation.graphCanvas'})}`,
        canvasData: {
          cells: (b?.graphCanvas?.nodes?.map(n => {
            const titleArray = n.title.split(':');
            return {
              id: n.id,
              shape: 'table',
              position: {
                x: n.x,
                y: n.y,
              },
              originKey: titleArray[0],
              count: parseInt(titleArray[1] || 0, 10),
            };
          }) || []).concat((b?.graphCanvas?.edges || []).map(e => {
            return {
              id: e.id,
              relation: e.relation || '1:n',
              shape: 'erdRelation',
              source: {
                cell: e.source,
                port: calcId(e.sourceAnchor, e.source, b?.graphCanvas?.nodes || [])
              },
              target: {
                cell: e.target,
                port: calcId(e.targetAnchor, e.target, b?.graphCanvas?.nodes || [])
              },
              vertices: e.pointers && e.pointers.slice(1, e.pointers.length - 1) || [],
            }
          }) || []),
        }
      }), []);
  const columnOrder = getFullColumns();
  const database = _.get(data, 'dataTypeDomains.database', []);
  const defaultDbType = database[0]?.code || 'MYSQL'; // 如果未设置默认的数据类型 则默认为第一个
  const relations = _.get(data, 'modules', []).reduce((a, b) => a.concat(b?.associations || []), []); // 所有的关联关系
  const dataTypeSupports = database.map(d => d.code);
  const name = getProjectName(projectName, '.pdman.json');
  return {
    name: name || '',
    describe: name || '',
    avatar: '',
    version: '3.0.0',
    createdTime: moment().format('YYYY-M-D HH:mm:ss'),
    updatedTime: '', // 最后一次的保存时间
    dbConns: _.get(data, 'profile.dbs', [])
      .map(conn => ({
        ..._.omit(conn, ['defaultDB', 'name']),
        defKey: conn.name || Math.uuid(),
        defName: conn.name || '',
      })),
    profile: {
      default: {
        db: defaultDb?.type || defaultDbType,
        dbConn: defaultDb?.name || '',
        entityInitFields: _.get(data, 'profile.defaultFields', [])
          .map(f => fieldsTransform(f, domains, mappings, defaultDb?.type || defaultDbType)),
      },
      javaHome: _.get(data, 'profile.javaConfig.JAVA_HOME', ''),
      sql: { delimiter: _.get(data, 'profile.sqlConfig', '') },
      dataTypeSupports,
      codeTemplates: database.map(d => {
        if (d.code.toLocaleUpperCase() === 'JAVA') {
          return {
            applyFor: 'JAVA',
            referURL: '',
            type: 'appCode',
            content : d.createTableTemplate || d.template
          };
        } else {
          return {
            applyFor: d.code,
            referURL: '',
            type: 'dbDDL',
            createTable: d.createTableTemplate || d.template,
            createIndex: d.createIndexTemplate || '',
          };
        }
      }),
      generatorDoc: {
        docTemplate: _.get(data, 'profile.wordTemplateConfig', ''),
      }
    },
    entities: entities.map(e => {
      const nameTemplate = (e.nameTemplate || '{defKey}[{defName}]')
        .replace('code', 'defKey')
        .replace('name', 'defName');
      // 找出所有与当前实体有关联的关系
      const relation = relations
        .filter(r => _.get(r, 'from.entity', '') === e.title)
        .map((r) => {
          const rowsData = (r.relation || '').split(':');
          return {
            myField: _.get(r, 'from.field', ''),
            refEntity: _.get(r, 'to.entity', ''),
            refField: _.get(r, 'to.field', ''),
            myRows: rowsData[0] || '',
            refRows: rowsData[1] || '',
            innerType: '',
          };
        });
      const headers = _.get(e, 'headers', []);
      columnOrder.forEach(c => {
        if (!headers.map(h => (h.fieldName || h.code)).includes(c.code)) {
          headers.push(c);
        }
      });
      return {
        defKey: e.title || '',
        defName: e.chnname || '',
        comment: e.remark || '',
        properties: { partitionBy : ''},
        nameTemplate: nameTemplate,
        headers: headers.map(h => {
          const fullData = columnOrder.filter(c => c.code === (h.fieldName || h.code)).map(c => ({...c, ...h}))[0];
          return {
            refKey: fullData.newCode || '',
            hideInGraph: fullData.relationNoShow || false,
          }
        }),
        fields: _.get(e, 'fields', [])
          .map(f => fieldsTransform(f, domains, mappings, defaultDb?.type || defaultDbType)),
        indexes: _.get(e, 'indexs', []).map(i => indexesTransform(i)),
        correlations: relation,
      }
    }),
    views: [], // pdman不支持视图 此处默认为空数组
    diagrams,
    dicts: [],
    viewGroups: _.get(data, 'modules', []).map(m => {
      return {
        defKey: m.name || '',
        defName: m.chnname || '',
        refEntities: (m.entities || []).map(e => e.title),
        refDiagrams: [`${m.name}-GRAPH-CANVAS`],
        refViews: [],
        refDicts: [],
      }
    }),
    dataTypeMapping: {
      referURL: '',
      mappings,
    },
    domains,
  };
};

export const generatorTableKey = (defKey, dataSource) => {
  const entities = (dataSource?.entities || []).map(e => e.defKey);
  if (!entities.includes(defKey)) {
    return defKey;
  } else {
    const key = defKey.split('_');
    return generatorTableKey(`${key.slice(0, key.length - 1).join('_')}_${parseInt(key[key.length - 1]) + 1}`, dataSource);
  }
}

export  const getTextWidth = (text, font, weight = 'normal') => {
  let dom = document.getElementById('calcTextWidth');
  if (!dom) {
    dom = document.createElement('div');
    dom.setAttribute('id', 'calcTextWidth');
    dom.style.display = 'inline-block';
    dom.style.fontWeight = weight;
    dom.style.fontSize = `${font}px`;
    document.body.appendChild(dom);
  }
  dom.innerText = typeof text === 'string' ?
    text.replace(/\r|\n|\r\n/g, '')
    : text;
  const width =  dom.getBoundingClientRect().width;
  dom.innerText = '';
  return Math.ceil(width);
};

export const reset = (f, dataSource, [key, id]) => {
  // domains,dicts,uiHint
  // 将defKey重置回去
  return {
    ...f,
    domain: f.domain ? (dataSource.domains.filter(d => d[key] === f.domain)[0]?.[id] || '') : '',
    refDict: f.refDict ? (dataSource.dicts.filter(d => d[key] === f.refDict)[0]?.[id] || '') : '',
    uiHint: f.uiHint ? (dataSource.uiHint.filter(d => d[key] === f.uiHint)[0]?.[id] || '') : '',
  };
};

export const transform = (f, dataSource, code, type = 'id') => {
  // 获取该数据表需要显示的字段
  const domains = dataSource?.domains || [];
  const entities = dataSource?.entities || [];
  const mappings = dataSource?.dataTypeMapping?.mappings || [];
  const db = _.get(dataSource, 'profile.default.db', _.get(dataSource, 'profile.dataTypeSupports[0].id'));
  const dicts = dataSource?.dicts || [];
  const uiHints = _.get(dataSource, 'profile.uiHint', []);
  const temp = {};
  if (f.domain){
    // 转换数据域
    const domain = domains.filter(dom => dom[type] === f.domain)[0] || { len: '', scale: '' };
    const dataType = mappings.filter(m => m.id === domain.applyFor)[0]?.[code || db] || '';
    temp.len = domain.len === undefined ? '' : domain.len;
    temp.scale = domain.scale === undefined ? '' : domain.scale;
    temp.type = dataType;
    temp.domain = type === 'id' ? (domain.defName || domain.defKey) : f.domain;
  }
  // 转换数据字典
  if (f.refDict) {
    const dict = dicts.filter(d => d[type] === f.refDict)[0];
    temp.refDict = dict?.defName || dict?.defKey;
    temp.refDictData = dict || {};
  }
  // 转换UI建议
  if (f.uiHint) {
    const uiHint = uiHints.filter(u => u[type] === f.uiHint)[0];
    temp.uiHint = uiHint?.defName || uiHint?.defKey;
  }
  // 转换引用数据表  如果是视图
  if (entities && f.refEntity) {
    const entity = entities.filter(e => e[type] === f.refEntity)[0];
    if (entity) {
      const field = (entity.fields || []).filter(fie => f.refEntityField === fie[type])[0];
      temp.refEntity = entity.defKey || '';
      temp.refEntityField = field?.defKey || '';
    }
  }
  return temp;
};

export  const calcNodeData = (preData, nodeData, dataSource, groups) => {
  // 节点源数据
  const headers = (nodeData?.headers || []).filter(h => !h.hideInGraph);
  const fields = (nodeData?.fields || []).filter(f => !f.hideInGraph)
      .map(f => ({...f, ...transform(f, dataSource)}));
  // 计算表头的宽度
  const headerText = `${nodeData.defKey}${nodeData.count > 0 ? `:${nodeData.count}` : ''}(${nodeData.defName})`;
  const headerWidth = getTextWidth(headerText, 12, 'bold') + 20;
  // 计算每一列最长的内容
  const maxWidth = {};
  const defaultWidth = {
    primaryKey: 30,// 主键和外键的默认宽度
    notNull: 70,// 非空默认宽度
  }
  const preFields = preData?.fields || [];
  fields.forEach((f) => {
    const preF = preFields.filter(p => p.id === f.id)[0];
    Object.keys(f).forEach((fName) => {
      if (!maxWidth[fName]) {
        maxWidth[fName] = 0;
      }
      const getFieldWidth = () => {
        const fieldValue = (f[fName] || '').toString();
        if (preF) {
          const preFieldValue = (preF[fName] || '').toString();
          if (preFieldValue === fieldValue && preData.maxWidth) {
            return preData.maxWidth[fName] || 0;
          }
          return getTextWidth(fieldValue, 12);
        }
        return getTextWidth(fieldValue, 12);
      };
      const fieldWidth = defaultWidth[fName] || getFieldWidth();
      if (maxWidth[fName] < fieldWidth) {
        maxWidth[fName] = fieldWidth;
      }
    });
  });
  // 计算矩形的宽高
  let width = headers.reduce((a, b) => {
    return a + (maxWidth[b.refKey] || 10) + 8;
  }, 0) + 16; // 内容宽度加上左侧边距
  if (width < headerWidth) {
    width = headerWidth;
  }
  // 高度除了字段还包含表名 所以需要字段 +1 同时需要加上上边距
  const height = (fields.length + 1) * 23 + 8;
  // 去除重复的字段
  const filterFields = (data) => {
    const repeat = [...data];
    return data.filter(d => {
      return repeat.filter(r => r.defKey === d.defKey).length === 1;
    });
  };
  const ports = groups ? {
    groups,
    items: filterFields(fields)
        .reduce((a, b, i) => {
      return a.concat([{
        group: 'in',
        args: { x: 0, y: 40 + i * 23 },
        id: `${b.id}${separator}in`,
      }, {
        group: 'out',
        args: { x: 0 + width, y: 40 + i * 23 },
        id: `${b.id}${separator}out`,
      }]);
    }, [])
        .concat([
      { group: 'extend',
        args: { x: (width / 4), y: 0 },
        id: 'extend-1',
      },
      { group: 'extend',
        args: { x: (width / 4) * 2 , y: 0 },
        id: 'extend-2',
      },
      { group: 'extend',
        args: { x: (width / 4) * 3 , y: 0 },
        id: 'extend-3',
      },
      { group: 'extend',
        args: { x: (width / 4), y: height },
        id: 'extend-4',
      },
      { group: 'extend',
        args: { x: (width / 4) * 2, y: height },
        id: 'extend-5',
      },
      { group: 'extend',
        args: { x: (width / 4) * 3, y: height },
        id: 'extend-6',
      },
    ])} : {};
  return {
    width,
    height,
    maxWidth,
    fields,
    headers,
    ports,
  };
};

export const mapData2Table = (n, dataSource, updateFields, groups, commonPorts,
                              relationType, commonEntityPorts) => {
  const nodeData = dataSource?.entities?.filter(e => e.id === n.originKey)[0];
  if (nodeData) {
    const { width, height, fields, headers, maxWidth, ports } = calcNodeData(n.data, nodeData, dataSource, groups);
    return {
      ...n,
      size: {
        width,
        height,
      },
      ports: relationType === 'entity' ? (n.ports || commonEntityPorts) : ports,
      updateFields,
      data: {
        ...nodeData,
        fields,
        headers,
        maxWidth,
      },
    };
  }
  return nodeData;
};

export const calcCellData = (cells = [], dataSource, updateFields, groups, commonPorts,
                             relationType, commonEntityPorts) => {
  const defaultEditNodeSize = {
    width: 80,
    height: 60,
    minHeight: 20,
  };
  const defaultEditNodeCircleSize = {
    width: 80,
    height: 60,
    minHeight: 20,
  };
  const groupNodes = cells.filter(c => c.shape === 'group');
  const remarks = cells.filter(c => c.shape === 'edit-node'
      || c.shape === 'edit-node-circle').map((n) => {
    return {
      ...n,
      ports: n.ports || commonPorts,
      size: n.size || (n.shape === 'edit-node' ? defaultEditNodeSize : defaultEditNodeCircleSize),
    };
  });
  const polygon = cells.filter(c => c.shape === 'edit-node-polygon'
    || c.shape === 'edit-node-circle-svg').map(c => {
    return {
      ...c,
      attrs: {
        body: {
          fill: c.fillColor,
        },
        text: {
          style: {
            fill: c.fontColor,
          },
          text: c.label || c.attrs?.text?.text || ''
        },
      },
    }
  });
  const nodes = cells.filter(c => c.shape === 'table').map((n) => {
    return mapData2Table(n, dataSource, updateFields, groups, commonPorts,
      relationType, commonEntityPorts);
  }).filter(n => !!n);
  const allNodes = (nodes || []).concat(remarks || []).concat(polygon || []);
  const edges = cells.filter(c => c.shape === 'erdRelation')
      .filter((e) => {
        return filterEdge(allNodes, e);
      });
  return (groupNodes || []).concat(nodes || []).concat(edges || []).concat(remarks || []).concat(polygon || []);
};

const getHeaders = (d, type) => {
  if (d.headers && d.headers.length > 0) {
    return d.headers;
  }
  return type === 'entity' ? getEmptyEntity().headers : getEmptyView().headers;
}
export const updateHeaders = (d, type) => {
  return _.omit({
    ...d,
    nameTemplate: d.nameTemplate || getEmptyEntity().nameTemplate,
    headers: getHeaders(d, type),
  }, ['rowNo', 'group']);
}


export const transformationData = (oldDataSource) => {
  // 某些场景下需要对原始项目进行兼容 统一在此处进行转换操作
  // 1.处理remark
  let tempDataSource = {...oldDataSource};
  if (oldDataSource.version === '3.0.0') {
    const refactor = (e) => {
      return {
        ...e,
        headers: (e.headers || []).map(h => {
          if (h.refKey === 'remark') {
            return {
              ...h,
              refKey: 'comment',
            };
          }
          return h;
        }),
        fields: (e.fields || []).map(f => {
          return {
            ..._.omit(f, ['remark']),
            comment: f.comment || f.remark || '',
          };
        }),
      };
    }
    tempDataSource = {
      ...tempDataSource,
      entities: (tempDataSource.entities || []).map(e => refactor(e)),
      views: (tempDataSource.views || []).map(v => refactor(v)),
    };
  }
  // 2.处理新增的列
  if (compareVersion('3.1.0', oldDataSource.version.split('.'))) {
    const refactor = (e) => {
      if ((e.headers || []).findIndex(h => h.refKey === 'uiHint') < 0) {
        return {
          ...e,
          headers: (e.headers || []).concat({
            "freeze": false,
            "refKey": "uiHint",
            "hideInGraph": true
          }),
        }
      }
      return e;
    }
    tempDataSource = {
      ...tempDataSource,
      profile: {
        ...tempDataSource.profile,
        uiHint: tempDataSource.profile?.uiHint || emptyProjectTemplate.profile.uiHint,
      },
      entities: (tempDataSource.entities || []).map(e => refactor(e)),
      views: (tempDataSource.views || []).map(v => refactor(v)),
    };
  }
  // 3.处理新增的数据字典模板
  if (compareVersion('3.2.0', oldDataSource.version.split('.'))) {
    const codeTemplates = _.get(tempDataSource, 'profile.codeTemplates', []);
    if (!codeTemplates.some(t => {
      return t.applyFor === 'dictSQLTemplate' && t.type === 'dbDDL'
    })) {
      tempDataSource = {
        ...tempDataSource,
        profile: {
          ...tempDataSource.profile,
          codeTemplates: _.get(oldDataSource, 'profile.codeTemplates', [])
            .concat(emptyProjectTemplate.profile.codeTemplates.filter(t => t.applyFor === 'dictSQLTemplate'))
        },
      };
    }
  }
  if (compareVersion('3.5.0', oldDataSource.version.split('.'))) {
    tempDataSource = reduceProject(tempDataSource, 'defKey');
  }
  if (compareVersion('3.5.2', oldDataSource.version.split('.'))) {
    tempDataSource = {
      ...tempDataSource,
      entities: (tempDataSource.entities || []).map(d => updateHeaders(d, 'entity')),
      views: (tempDataSource.views || []).map(d => updateHeaders(d, 'view')),
    };
  }
  if (compareVersion('3.5.6', oldDataSource.version.split('.'))) {
    tempDataSource = {
      ...tempDataSource,
      diagrams: (tempDataSource.diagrams || []).map(d => {
        const originKeys = [];
        return {
          ...d,
          canvasData: {
            ...(d.canvasData || {}),
            cells: (d.canvasData?.cells || []).map(c => {
              if (c.shape === 'table') {
                const count = originKeys.filter(k => k === c.originKey).length;
                originKeys.push(c.originKey);
                return {
                  ...c,
                  count,
                };
              }
              return c;
            }),
          },
        };
      }),
    };
  }
  return tempDataSource;
};

export const validateNeedSave = (dataSource) => {
  const cacheData = getAllTabData();
  if (Object.keys(cacheData).length > 0) {
    return true;
  } else if (dataSource !== getMemoryCache('data')) {
    return true;
  }
  return false;
};

export const defaultJVM = '-Xms128m -Xmx1024m -XX:-UseGCOverheadLimit';

export const emptyDictSQLTemplate =  {
  type: "dbDDL",
  applyFor: "dictSQLTemplate",
  content: ''
};

export const calcField = (f, entities = [], dicts = [], domains = [], uiHint = [], type) => {
  const other = {};
  if (f.refEntity) {
    const newEntity = entities.filter(e => f.refEntity === e[type])[0];
    if (newEntity) {
      other.refEntity = newEntity.id || '';
      other.refEntityField = newEntity
        .fields?.filter(field => field[type] === f.refEntityField)[0]?.id || '';
    }
  }
  return {
    ...f,
    refDict: f.refDict ? dicts.filter(d => d[type] === f.refDict)[0]?.id : (f.refDict || ''),
    domain: f.domain ? domains.filter(d => d[type] === f.domain)[0]?.id : (f.domain || ''),
    uiHint: f.uiHint ? uiHint.filter(u => u[type] === f.uiHint)[0]?.id : (f.uiHint || ''),
    id: Math.uuid(),
    old: type === 'defKey' ? f.defKey : f.id,
    ...other,
  };
};

export const calcDomains = (domains = [], mapping = [], type) => {
  return domains.map(d => {
    return {
      ...d,
      applyFor: mapping.filter(m => m[type] === d.applyFor)[0]?.id || d.applyFor,
    };
  })
};

export const calcEntityOrView = (data = [], dicts, domains, uiHint, entities, type) => {
  const tempData = data.map(d => ({
    ...d,
    old: type === 'defKey' ? d.defKey : d.id,
    id: Math.uuid()
  }));
  const newData = tempData.map(e => {
    const fields = e.fields?.map(f => calcField(f, entities || tempData, dicts, domains, uiHint, type)) || [];
    return {
      ...e,
      fields,
      indexes: e.indexes?.map(i => {
        return {
          ...i,
          id: Math.uuid(),
          fields: i.fields?.map(f => {
            return {
              ...f,
              fieldDefKey: fields.filter(fie => fie.old === f.fieldDefKey)[0]?.id,
              id: Math.uuid(),
            };
          })
        };
      }) || [],
    };
  });
  return newData.map(e => {
    if (e.correlations) {
      return {
        ...e,
        correlations: e.correlations?.map(c => {
          const refEntity = newData.filter(e => e[type] === c.refEntity)[0];
          if (!refEntity) {
            return null;
          }
          return {
            ...c,
            myField: e.fields?.filter(f => f[type] === c.myField)[0]?.id || c.myField,
            refEntity: refEntity.id,
            refField: refEntity?.fields?.filter(f => f[type] === c.refField)[0]?.id || c.refField,
          }
        })?.filter(c => !!c),
      };
    }
    return e;
  })
};

export const reduceProject = (emptyProject, type) => {
  const dataTypeSupports = emptyProject?.profile?.dataTypeSupports?.map(d => {
      return {
        defKey: type === 'defKey' ? d : d.defKey,
        id: Math.uuid(),
        old: type === 'defKey' ? d : d.id,
      };
    }) || [];
  const codeTemplates = emptyProject.profile?.codeTemplates.map(c => {
    return {
      ...c,
      applyFor: c.applyFor !== 'dictSQLTemplate' ? dataTypeSupports
        .filter(d => d[type] === c.applyFor)[0]?.id : 'dictSQLTemplate',
    };
  }) || [];
  const uiHint = emptyProject.profile?.uiHint?.map(u => {
    return {
      ...u,
      old: type === 'defKey' ? u.defKey : u.id,
      id: Math.uuid(),
    };
  }) || [];
  const dbConn = emptyProject?.dbConn?.map(d => {
    return {
      ...d,
      type: dataTypeSupports.filter(t => t.old === d.type)[0]?.id || d.type,
    };
  });
  const mappings = emptyProject?.dataTypeMapping?.mappings?.map(m => {
    return {
      defKey: m.defKey,
      defName: m.defName,
      old: type === 'defKey' ? m.defKey : m.id,
      id: Math.uuid(),
      ...dataTypeSupports.reduce((pre, next) => {
        return {
          ...pre,
          [next.id]: m[next.old],
        };
      }, {}),
    };
  });
  const domains = calcDomains(emptyProject?.domains, mappings, type)
    ?.map((d) => ({
      ...d,
      id: Math.uuid(),
      old: type === 'defKey' ? d.defKey : d.id,
    })) || [];
  const dicts = emptyProject?.dicts?.map(d => {
    return {
      ...d,
      old: type === 'defKey' ? d.defKey : d.id,
      id: Math.uuid(),
      items: (d.items || []).map(i => {
        return {
          ...i,
          id: Math.uuid(),
        };
      }),
    };
  }) || [];
  const entities = calcEntityOrView(emptyProject?.entities || [], dicts, domains, uiHint, null, type);
  const calcId = (data = [], refKeys) => {
    if (refKeys) {
      return data
        .filter(d => refKeys.includes(d[type]))
        .map(d => d.id);
    }
    return [];
  };
  const getFieldId = (c, cells, name) => {
    const cell = cells.filter(ce => ce.id === c[name]?.cell)[0];
    const entity = entities.filter(e => e[type] === cell?.originKey)[0];
    if (entity) {
      const field = entity?.fields?.filter(f => f[type] === c[name]?.port?.split(separator)[0])[0];
      return `${field?.id || ''}${separator}${c[name]?.port?.split(separator)[1]}`;
    }
    return c[name]?.port;
  };
  const diagrams = emptyProject?.diagrams?.map(d => {
    return {
      ...d,
      old: type === 'defKey' ? d.defKey : d.id,
      id: Math.uuid(),
      canvasData: {
        ...d.canvasData,
        cells: (d.canvasData?.cells || []).map(c => {
          if (c.shape === 'table') {
            return {
              ...c,
              originKey: entities.filter(e => e[type] === c.originKey)[0]?.id,
            };
          } else if (c.shape === 'erdRelation') {
            return {
              ...c,
              target: {
                ...c.target,
                port: getFieldId(c, d.canvasData?.cells, 'target'),
              },
              source: {
                ...c.source,
                port: getFieldId(c, d.canvasData?.cells, 'source'),
              },
            };
          }
          return c;
        })
      }
    };
  }) || [];
  const views = calcEntityOrView(emptyProject?.views || [], dicts, domains, uiHint, entities, type).map(v => {
    return {
      ...v,
      refEntities: (v.refEntities ? entities.filter(e => {
        return v.refEntities.includes(e[type])
      }): []).map(e => e.id),
    };
  });
  return {
    ...emptyProject,
    profile: {
      ...emptyProject.profile,
      default: {
        ...emptyProject.profile?.default,
        db: (dataTypeSupports || []).filter(d => d[type] === emptyProject.profile?.default?.db)[0]?.id || '',
        entityInitFields: emptyProject.profile
          ?.default?.entityInitFields?.map(f => {
            return calcField(f, entities, dicts, domains, uiHint, type);
          }).map(f => _.omit(f, 'old'))
      },
      dataTypeSupports: dataTypeSupports.map(d => _.omit(d, 'old')),
      codeTemplates,
      uiHint: uiHint.map(u => _.omit(u, 'old')),
    },
    dicts: dicts.map(d => _.omit(d, 'old')),
    entities: entities.map(d => {
      return {
        ..._.omit(d, 'old'),
        fields: (d.fields || []).map(f => ({..._.omit(f, 'old')}))
      };
    }),
    views: views.map(v => {
      return {
        ..._.omit(v, 'old'),
        fields: (v.fields || []).map(f => ({..._.omit(f, 'old')}))
      };
    }),
    dataTypeMapping: {
      ...emptyProject?.dataTypeMapping,
      mappings: mappings.map(m => _.omit(m, 'old')),
    },
    dbConn,
    domains: domains.map(d => _.omit(d, 'old')),
    viewGroups: emptyProject?.viewGroups?.map(v => {
      return {
        ...v,
        id: Math.uuid(),
        refEntities: calcId(entities, v.refEntities),
        refDicts: calcId(dicts, v.refDicts),
        refViews: calcId(views, v.refViews),
        refDiagrams: calcId(diagrams, v.refDiagrams),
      };
    }),
    diagrams: diagrams.map(d => _.omit(d, 'old')),
    standardFields: (emptyProject?.standardFields || []).map(g => {
      return {
        ...g,
        id: Math.uuid(),
        fields: (g.fields || []).map(f => {
          return calcField(f, entities, dicts, domains, uiHint, type);
        }).map(f => _.omit(f, ['old', '__key']))
      };
    })
  }
};


export const findExits = (pre = [], next = []) => {
  // 先找出已经存在的
  return next.map((d) => {
    const index = pre.findIndex(cd => cd.defKey === d.defKey);
    if (index >= 0) {
      // 已经存在的需要替换掉id
      return {
        old: d.id,
        new: pre[index].id,
      };
    }
    return null;
  }).filter(d => !!d);
};

// 需要替换domain的applyFor
// 实体和视图以及关系图
// 1.替换数据域,更新applyFor
export const replaceDomainsApplyFor = (domains, replace) => {
  return domains.map(d => {
    const needReplace = replace.filter(r => r.old === d.applyFor)[0];
    if (needReplace){
      return {
        ...d,
        applyFor: needReplace.new,
      };
    }
    return d;
  });
}
// 2.替换实体或者视图
export const replaceEntitiesOrViews = (data, replace, entities = []) => {
  const getEntityAndField = (entityId, fieldId) => {
    const refEntity = replace.entities.filter(r => r.old === entityId)[0]?.new;
    if (refEntity) {
      const oldEntity = entities.filter(e => entityId === e.id)[0];
      const newEntity = entities.filter(e => refEntity === e.id)[0];
      if (newEntity && oldEntity) {
        const oldField = oldEntity.fields?.filter(f => f.id === fieldId)[0]?.defKey;
        const newField = newEntity.fields?.filter(f => f.defKey === oldField)[0]?.id;
        return {
          entity: refEntity,
          field: newField
        };
      }
    }
    return {
      entity: entityId,
      field: fieldId,
    };
  };
  const replaceField = (f) => {
    const other = {};
    if (f.refEntity) {
      const { entity, field } = getEntityAndField(f.refEntity, f.refEntityField);
      other.refEntity = entity || '';
      other.refEntityField = field || '';
    }
    return {
      ...f,
      refDict: replace.dicts.filter(r => r.old === f.refDict)[0]?.new || f.refDict,
      domain: replace.domains.filter(r => r.old === f.domain)[0]?.new || f.domain,
      uiHint: replace.uiHint.filter(r => r.old === f.uiHint)[0]?.new || f.uiHint,
      ...other,
    };
  }
  return data.map(e => {
    const otherData = {};
    const tempE = replace.entities.filter(re => re.old === e.id)[0];
    if (e.refEntities) {
      otherData.refEntities = e.refEntities.map(re => {
        const ref = replace.entities.filter(ret => ret.old === re)[0];
        if (ref) {
          return ref.new;
        }
        return re;
      });
    }
    if (e.correlations) {
      otherData.correlations = e.correlations?.map(c => {
        const my = getEntityAndField(e.id, c.myField);
        const ref = getEntityAndField(c.refEntity, c.refField);
        return {
          ...c,
          myField: my.field,
          refEntity: ref.entity,
          refField: ref.field,
        }
      });
    }
    return {
      ...e,
      id: tempE?.new || e.id,
      fields: (e.fields || []).map(f => replaceField(f)),
      ...otherData,
    };
  })
};
// 3.替换关系图
export const replaceDiagrams = (data, replace) => {
  return data?.map(d => {
    return {
      ...d,
      canvasData: {
        ...d.canvasData,
        cells: (d.canvasData?.cells || []).map(c => {
          if (c.shape === 'table') {
            return {
              ...c,
              originKey: replace.filter(r => r.old === c.originKey)[0]?.new || c.originKey,
            };
          }
          return c;
        })
      }
    };
  })
}
