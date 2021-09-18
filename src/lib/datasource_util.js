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

export const updateAllData = (dataSource, tabs) => {
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
    const typeName = t.type === 'entity' ? 'entities' : 'views';
    const oldData = tempData[typeName].filter(e => e.id === t.tabKey.split(separator)[0])[0];
    return {
      type: t.type,
      key: t.tabKey,
      oldData,
      data: getDataByTabId(t.tabKey)?.data || oldData || {}
    }
  }).forEach(t => {
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
      }}) + ';';
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
        dataSource: {
          ...tempData,
          viewGroups,
        },
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

const refactorAllFields = (dataSource, fuc) => {
  const allData = getAllTabData();
  let tempDataSource = {...dataSource};
  // 视图和数据表
  const names = [{key: 'entity', keys: 'entities'}, {key: 'view', keys: 'views'}];
  names.forEach((name) => {
    const currentCacheData = Object.keys(allData)
      .filter(d => (allData[d].type === name.key)).map(d => ({tabKey: d, data: allData[d].data || {}}));
    tempDataSource = {
      ...tempDataSource,
      [name.keys]: _.get(dataSource, name.keys, [])
        .map((e) => {
          const entity = currentCacheData.filter(cache => cache.data.defKey === e.defKey)[0];
          let tempEntity = {...e};
          if (entity) {
            tempEntity = {
              ...tempEntity,
              ...entity.data,
            };
          }
          tempEntity = {
            ...tempEntity,
            fields: (tempEntity?.fields || []).map(f => fuc(f)),
          };
          if (entity) {
            setDataByTabId(entity.tabKey, {
              key: e.defKey,
              type: name.key,
              data: tempEntity,
            }); // 重新更新缓存
          }
          return tempEntity;
        }),
    }
  });
  const otherFields = ['profile.default.entityInitFields', 'standardFields'];
  // 标准字段库
  // 默认字段库
  otherFields.forEach((other) => {
    tempDataSource = _.set(tempDataSource, other, _.get(tempDataSource, other, [])
      .map(f => fuc(f)));
  });
  return tempDataSource;
}

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
  return !Object.keys(item).some(n => !fieldNames.includes(n));
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
        || apply[applyArray[0]] || {})?.type.toLocaleLowerCase()?.replace(/\(\d+,*\d*\)/g, '');
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
    document.body.appendChild(dom);
  }
  dom.style.fontWeight = weight;
  dom.style.fontSize = `${font}px`;
  dom.innerText = text;
  const width =  dom.getBoundingClientRect().width;
  document.body.removeChild(dom);
  return Math.ceil(width);
};

export  const calcNodeData = (nodeData, dataSource, groups) => {
  // 节点源数据
  // 获取该数据表需要显示的字段
  const domains = dataSource?.domains || [];
  const mappings = dataSource?.dataTypeMapping?.mappings || [];
  const db = _.get(dataSource, 'profile.default.db', _.get(dataSource, 'profile.dataTypeSupports[0].id'));
  const dicts = dataSource?.dicts || [];
  const uiHints = _.get(dataSource, 'profile.uiHint', []);
  const transform = (f) => {
    const temp = {};
    if (f.domain){
      // 转换数据域
      const domain = domains.filter(dom => dom.id === f.domain)[0] || { len: '', scale: '' };
      const dataType = mappings.filter(m => m.id === domain.applyFor)[0]?.[db] || '';
      temp.len = domain.len === undefined ? '' : domain.len;
      temp.scale = domain.scale === undefined ? '' : domain.scale;
      temp.type = dataType;
      temp.domain = domain.defName || domain.defKey;
    }
    // 转换数据字典
    if (f.refDict) {
      const dict = dicts.filter(d => d.id === f.refDict)[0];
      temp.refDict = dict?.defName || dict?.defKey;
    }
    // 转换UI建议
    if (f.uiHint) {
      const uiHint = uiHints.filter(u => u.id === f.uiHint)[0];
      temp.uiHint = uiHint?.defName || uiHint?.defKey;
    }
    return temp;
  };
  const headers = nodeData?.headers.filter(h => !h.hideInGraph);
  const fields = (nodeData?.fields || []).filter(f => !f.hideInGraph)
      .map(f => ({...f, ...transform(f)}));
  // 计算表头的宽度
  const headerWidth = getTextWidth(
      `${nodeData.defKey}${nodeData.count > 0 ? `:${nodeData.count}` : ''}(${nodeData.defName})`,
      12, 'bold') + 20;
  // 计算每一列最长的内容
  const maxWidth = {};
  const defaultWidth = {
    primaryKey: 30,// 主键和外键的默认宽度
    notNull: 70,// 非空默认宽度
  }
  fields.forEach((f) => {
    Object.keys(f).forEach((fName) => {
      if (!maxWidth[fName]) {
        maxWidth[fName] = 0;
      }
      const fieldWidth = defaultWidth[fName] || getTextWidth((f[fName] || '').toString(), 12);
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
    const { width, height, fields, headers, maxWidth, ports } = calcNodeData(nodeData, dataSource, groups);
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

export const defaultJVM = '-Xms512m -Xmx2048m -XX:MaxPermSize=256m -XX:-UseGCOverheadLimit';

export const emptyDictSQLTemplate =  {
  type: "dbDDL",
  applyFor: "dictSQLTemplate",
  content: ''
};

