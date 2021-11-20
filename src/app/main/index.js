import React, {useState, useMemo, useEffect, useRef} from 'react';
import _ from 'lodash/object';
import moment from 'moment';
import {
  Menu,
  Tab,
  Button,
  Loading,
  openModal,
  Message,
  Icon,
  Modal,
  FormatMessage,
  Checkbox, Tooltip, Upload, Terminal, Download,
} from 'components';
import Dict from '../container/dict';
import Entity from '../container/entity';
import View from '../container/view';
import Relation from '../container/relation';
import Config from '../container/config';
import DbConnect from '../container/dbconnect';
import DbReverseParse from '../container/tools/dbreverseparse';
import ExportSql from '../container/tools/exportsql';
import ImportPd from '../container/tools/importpd';
import StandardField from '../container/standardfield';
import HeaderTool from './HeaderTool';
import MessageHelp from './MessageHelp';
import { separator } from '../../../profile';
import { getMenu, getMenus, dealMenuClick } from '../../lib/contextMenuUtil';
//import { getCurrentVersionData } from '../../lib/datasource_version_util';
//import { connectDB } from '../../lib/middle';
//import { generateFile } from '../../lib/generatefile';
//import { getCurrentVersionData } from '../../lib/datasource_version_util';
import {
  validateKey,
  updateAllData,
  allType,
  pdman2sino,
  emptyDictSQLTemplate,
  reduceProject,
  findExits,
  replaceDiagrams,
  replaceEntitiesOrViews, replaceDomainsApplyFor, calcDomains, reset, updateHeaders,
} from '../../lib/datasource_util';
import {clearAllTabData, getDataByTabId, setDataByTabId} from '../../lib/cache';
import {removeSave, Save} from '../../lib/event_tool';

import './style/index.less';
import {getPrefix} from '../../lib/prefixUtil';
import {addBodyEvent, removeBodyEvent} from '../../lib/listener';
import {firstUp} from '../../lib/string';
import {connectDB, getLogPath, selectWordFile, showItemInFolder} from '../../lib/middle';
import { imgAll } from '../../lib/generatefile/img';
import {compareVersion} from '../../lib/update';

const TabItem = Tab.TabItem;

const Index = React.memo(({getUserData, open, openTemplate, config, common, prefix, projectInfo,
                            ...restProps}) => {
  const isRefreshRef = useRef(false);
  const [mainId, setMainId] = useState(Math.uuid());
  const [tabs, updateTabs] = useState([]);
  const autoSaveRef = useRef(null);
  const isResize = useRef({status: false});
  const resizeContainer = useRef(null);
  const resizeOther = useRef(null);
  const menuContainerModel = useRef(null);
  const menuContainerDataType = useRef(null);
  const injectTempTabs = useRef([]);
  const activeTabStack = useRef([]);
  const importPdRef = useRef(null);
  const tabsRef = useRef(tabs);
  tabsRef.current = tabs;
  const dataSourceRef = useRef({});
  dataSourceRef.current = restProps.dataSource;
  const menuContainerWidth = 290;
  const menuMinWidth = 50;
  const menuNorWidth = parseFloat(dataSourceRef.current?.profile?.menuWidth)
    || (menuContainerWidth - menuMinWidth);
  const configRef = useRef({});
  configRef.current = config;
  const [groupType, updateGroupType] = useState(restProps.dataSource?.profile?.modelType || 'modalAll');
  const [activeKey, updateActiveKey] = useState('');
  const tabInstanceRef = useRef({});
  const menuModelRef = useRef(null);
  const menuDomainRef = useRef(null);
  const currentMenu = useRef(null);
  const standardFieldRef = useRef(null);
  const activeKeyRef = useRef(activeKey);
  activeKeyRef.current = activeKey;
  const activeTab = tabs.filter(t => t.tabKey === activeKey)[0];
  const [contextMenus, updateContextMenus] = useState([]);
  const [draggable, setDraggable] = useState(false);
  const { lang } = config;
  const cavRefArray = useRef([]);
  const headerToolRef = useRef(null);
  const [menuType, setMenuType] = useState('1');
  const projectInfoRef = useRef(projectInfo);
  projectInfoRef.current = projectInfo;
  const refreshProject = () => {
    Modal.confirm({
      title: FormatMessage.string({id: 'refreshConfirmTitle'}),
      message: FormatMessage.string({id: 'refreshConfirm'}),
      onOk:() => {
        isRefreshRef.current = true;
        if (projectInfoRef.current) {
          open(FormatMessage.string({id: 'readProject'}), projectInfoRef.current);
        } else {
          openTemplate(null, null, FormatMessage.string({id: 'readProject'}));
        }
      },
    });
  };
  useEffect(() => {
    if(isRefreshRef.current) {
      isRefreshRef.current = false;
      updateTabs((pre) => {
        return pre.filter((p) => {
          const { name } = allType.filter(t => t.type === p.type)[0];
          return restProps.dataSource[name].findIndex(d => d.id === p.menuKey) > -1;
        });
      });
      setMainId(Math.uuid());
    }
  }, [restProps.dataSource]);
  const saveProject = (saveAs, callback) => {
    const isSaveAs = saveAs || !projectInfoRef.current;
    const newData = updateAllData(dataSourceRef.current,
        injectTempTabs.current.concat(tabsRef.current), () => {
        // eslint-disable-next-line no-use-before-define
        _openModal('config');
      });
    if (newData.result.status) {
      restProps.save(newData.dataSource, FormatMessage.string({id: 'saveProject'}), isSaveAs, (err) => {
        if (!err) {
          if (!isSaveAs) {
            restProps?.update(newData.dataSource);
          }
          Message.success({title: FormatMessage.string({id: 'saveSuccess'})});
          injectTempTabs.current = [];
          clearAllTabData();
          callback && callback(false);
        } else {
          callback && callback(true);
          Message.error({title: FormatMessage.string({id: 'saveFail'})});
        }
      });
    } else {
      callback && callback(true);
      Modal.error({
        title: FormatMessage.string({id: 'optFail'}),
        message: newData.result.message,
      });
    }
  };
  /*const changes = useMemo(() => {
    return getCurrentVersionData(restProps.dataSource, restProps.versionsData);
  }, [restProps.dataSource, restProps.versionsData]);*/
  useEffect(() => {
    Save(() => {
      saveProject();
    });
    return () => {
      removeSave();
    };
  }, [restProps.dataSource, tabs]);
  const validateTableStatus = (key) => {
    return tabsRef.current.findIndex(t => t.tabKey === key) >= 0;
  };
  const scaleChange = (scale) => {
    headerToolRef.current.setScaleNumber(scale);
  };
  const renderReady = (cav, key) => {
    scaleChange(1);
    cavRefArray.current.push({
      cav,
      key,
    });
  };
  const _groupMenuChange = () => {
    (currentMenu.current || menuModelRef.current)?.restSelected();
    updateGroupType((pre) => {
      return pre === 'modalAll' ?  'modalGroup' : 'modalAll';
    });
  };
  const getCurrentCav = () => {
    return cavRefArray.current.filter(cav => activeKeyRef.current === cav.key)[0]?.cav;
  };
  useEffect(() => {
    const cavRef = getCurrentCav();
    if (cavRef) {
      // 更新放大倍数
      scaleChange(cavRef.getScaleNumber().sx || 1);
      setDraggable(true);
    } else {
      setDraggable(false);
    }
  }, [activeKey]);
  const _tabChange = (menuKey) => {
    updateActiveKey(menuKey);
    activeTabStack.current = activeTabStack.current.filter(k => k !== menuKey);
    activeTabStack.current.push(menuKey);
  };
  const _tabClose = (tabKey) => {
    const closeTab = () => {
      const tabKeys = [].concat(tabKey);
      // 重新设置激活的tab页
      let newActiveKey = null;
      activeTabStack.current = activeTabStack.current.filter(k => !tabKeys.includes(k));
      if (tabKeys.includes(activeKey)) {
        newActiveKey = activeTabStack.current[activeTabStack.current.length - 1];
      }
      updateTabs((pre) => {
        return pre.filter(t => !tabKeys.includes(t.tabKey));
      });
      cavRefArray.current = cavRefArray.current.filter(c => !tabKeys.includes(c.key));
      updateActiveKey((pre) => {
        return newActiveKey || pre;
      });
    };
    if (getDataByTabId(tabKey)) {
      Modal.confirm({
        title: FormatMessage.string({id: 'saveConfirmTitle'}),
        message: FormatMessage.string({id: 'saveConfirm'}),
        onOk:() => {
          closeTab();
        },
      });
    } else {
      closeTab();
    }
  };
  const _tabCloseOther = (tabKey) => {
    activeTabStack.current = [tabKey];
    updateTabs(pre => pre.filter(t => t.tabKey === tabKey));
    cavRefArray.current = cavRefArray.current.filter(c => c.key !== tabKey);
    updateActiveKey(tabKey);
    _tabChange(tabKey);
  };
  const _tabCloseAll = () => {
    updateTabs([]);
    cavRefArray.current = [];
    activeTabStack.current = [];
    updateActiveKey('');
  };
  const _onMenuClick = (menuKey, type, parentKey, icon, param) => {
    console.log(menuKey, type, parentKey, icon);
    const tabKey = menuKey + separator + type;
    const tempTabs = [...tabsRef.current];
    if (!tempTabs.some(t => t.tabKey === tabKey)) {
      tempTabs.push({
        tabKey,
        menuKey,
        type,
        icon,
        style: type === 'diagram' ? { overflow: 'hidden' } : {},
        param,
      });
    } else if (param){
      tabInstanceRef.current[tabKey].twinkle(param.defKey);
    }
    updateTabs(tempTabs);
    updateActiveKey(tabKey);
    activeTabStack.current = activeTabStack.current.filter(k => k !== tabKey);
    activeTabStack.current.push(tabKey);
  };
  const _onContextMenu = (key, type, selectedMenu, parentKey) => {
    updateContextMenus(getMenus(key, type, selectedMenu, parentKey, groupType));
  };
  const _contextMenuClick = (e, m, callback) => {
    dealMenuClick(restProps?.dataSource, m, restProps?.update, _tabClose, callback);
  };
  const sliderChange = (percent) => {
    const cavRef = cavRefArray.current.filter(cav => activeKeyRef.current === cav.key)[0]?.cav;
    if (cavRef) {
      cavRef.zoomGraph(percent * 2 / 100, true);
    }
  };
  const resize = (factor) => {
    const cavRef = getCurrentCav();
    if (cavRef) {
      cavRef.validateScale(factor);
    }
  };
  const undo = () => {
    const cavRef = getCurrentCav();
    cavRef.undo();
  };
  const redo = () => {
    const cavRef = getCurrentCav();
    cavRef.redo();
  };
  const exportWord = () => {
    selectWordFile(dataSourceRef.current)
      .then(([dir, template]) => {
        const length = dataSourceRef.current.diagrams?.length || 0;
        let count = 0;
        restProps.openLoading(FormatMessage.string({
          id: 'toolbar.exportWordStep1',
          data: { count, length },
        }));
        imgAll(dataSourceRef.current, () => {
          count += 1;
          restProps.openLoading(FormatMessage.string({
            id: 'toolbar.exportWordStep1',
            data: { count, length },
          }));
        }).then((imgDir) => {
          restProps.openLoading(FormatMessage.string({id: 'toolbar.exportWordStep2'}));
          connectDB(dataSourceRef.current, configRef.current, {
            sinerFile: projectInfo,
            docxTpl: template,
            imgDir: imgDir,
            imgExt: '.png',
            outFile: dir,
          }, 'GenDocx', (result) => {
            if (result.status === 'FAILED') {
              const termReady = (term) => {
                term.write(typeof result.body === 'object' ? JSON.stringify(result.body, null, 2)
                  : result.body);
              };
              restProps.closeLoading();
              Modal.error({
                bodyStyle: {width: '80%'},
                contentStyle: {width: '100%', height: '100%'},
                title: FormatMessage.string({id: 'optFail'}),
                message: <div>
                  <div style={{textAlign: 'center'}}><FormatMessage id='dbConnect.log'/><a onClick={showItemInFolder}>{getLogPath()}</a></div>
                  <Terminal termReady={termReady}/>
                </div>,
              });
            } else {
              restProps.closeLoading();
              Modal.success({
                title: FormatMessage.string({
                  id: 'toolbar.exportSuccess',
                }),
                message: FormatMessage.string({
                  id: 'toolbar.exportPath',
                  data: {path: dir},
                }),
              });
            }
          });
        });
      });
  };
  const exportImg = () => {
    const cavRef = getCurrentCav();
    cavRef.exportImg();
  };
  const calcDomain = (data = [], dbKey = null, finalDomains) => {
    const dataTypeSupports = _.get(dataSourceRef.current, 'profile.dataTypeSupports', []);
    const defaultDb = _.get(dataSourceRef.current, 'profile.default.db', dataTypeSupports[0]);
    const mappings = _.get(dataSourceRef.current, 'dataTypeMapping.mappings', []);
    const domains = finalDomains || _.get(dataSourceRef.current, 'domains', []);
    const dbConn = dataSourceRef.current?.dbConn || [];
    const currentDb = dbConn.filter(d => d.id === dbKey)[0]?.type || defaultDb;
    return data.map((d) => {
      return {
        ...d,
        fields: (d.fields || []).map((f) => {
          const domainData = domains.map((domain) => {
            const mapping = mappings.filter(m => m.id === domain.applyFor)[0];
            return {
              id: domain.id,
              type: `${mapping?.[currentDb]?.toLocaleLowerCase()}${domain.len || ''}${domain.scale || ''}`,
            };
          }).filter(domain => domain.type === `${f.type?.toLocaleLowerCase()}${f.len || ''}${f.scale || ''}`)[0];
          const domain = domainData?.id || '';
          if (domain) {
            return {
              ...f,
              domain,
              len: '',
              scale: '',
            };
          }
          return {
            ...f,
            len: f.len === null ? '' : f.len,
            scale: f.scale === null ? '' : f.scale,
            domain: '',
          };
        }),
      };
    });
  };
  const calcRepeat = (pre, next, type, needOrigin) => {
    const origin =  type === 'entity' ? pre
      .filter(p => next.findIndex(n => n.defKey === p.defKey) < 0) : pre;
    const add = type === 'entity' ? next : next.filter(((d) => {
      return pre.findIndex(cd => cd.defKey === d.defKey) < 0;
    }));
    if (needOrigin) {
      return [origin, add, findExits(pre, next)];
    }
    return [origin.concat(add), findExits(pre, next)];
  };
  const injectDataSource = (dataSource, modal) => {
    restProps?.update({...dataSource});
    Message.success({title: FormatMessage.string({id: 'optSuccess'})});
    modal && modal.close();
  };
  const updateEntities = (data, domains, dbKey, modal) => {
    const [originEntities, addEntities] = calcRepeat(dataSourceRef.current.entities, data, 'entity', true);
    const finalDomains = domains.map(d => ({...d, id: d.id || Math.uuid()}));
    const addEntityKeys = addEntities.map(e => e.id);
    injectDataSource({
      ...dataSourceRef.current,
      domains: finalDomains,
      entities: originEntities.concat(calcDomain(addEntities, dbKey, finalDomains)
          .map(e => ({
            ...updateHeaders(e, 'entity'),
            fields: (e.fields || []).map((f, i) => {
              return {
                ...f,
                hideInGraph: i >
                  (parseInt(dataSourceRef.current.profile.relationFieldSize, 10) - 1),
              };
            }),
            indexes: e.indexes?.map((i) => {
              return {
                ...i,
                id: Math.uuid(),
                fields: i.fields?.map((fi) => {
                  return {
                    ...fi,
                    fieldDefKey: (e.fields || [])
                      .filter(fie => fie.defKey === fi.fieldDefKey)[0]?.id,
                    id: Math.uuid(),
                  };
                }),
              };
            }) || [],
          }))),
      viewGroups: (dataSourceRef.current.viewGroups || []).map((g) => {
        const currentGroupData = addEntities.filter(d => d.group === g.id).map(d => d.id);
        return {
          ...g,
          refEntities: [...new Set((g.refEntities || [])
            .filter(e => !addEntityKeys.includes(e))
            .concat(currentGroupData))],
        };
      }),
    }, modal);
  };
  const importFromPDMan = (type) => {
    Upload('application/json', (data, file) => {
      try {
        let newData = type === 'chiner' ? JSON.parse(data) : pdman2sino(JSON.parse(data), file.name);
        let modal;
        const onCancel = () => {
          modal.close();
        };
        const compareType = compareVersion('3.5.0', newData.version.split('.')) ? 'defKey' : 'old';
        newData = reduceProject(newData, compareType);
        const onOk = () => {
          // 合并分组 关系图 数据域
          // 1.合并重复的数据域相关
          const currentMappings = (dataSourceRef.current?.dataTypeMapping?.mappings || []);
          const [dicts, replaceDicts] = calcRepeat(dataSourceRef.current.dicts,
            newData.dicts || []);
          const [uiHint, replaceUiHint] = calcRepeat(dataSourceRef.current?.profile?.uiHint,
            newData?.profile?.uiHint || []);
          const [mappings, replaceMappings] = calcRepeat(currentMappings,
            newData?.dataTypeMapping?.mappings || []);
          const [originViews, addViews, replaceViews] = calcRepeat(dataSourceRef.current.views,
            newData.views, null, true);
          const [domains, replaceDomains] = calcRepeat(dataSourceRef.current.domains,
            newData.domains);
          const [originEntities, addEntities, replaceEntities] =
            calcRepeat(dataSourceRef.current.entities,
            (importPdRef.current.getData()
            .reduce((a, b) => a.concat((b.fields || [])
              .map(f => ({
                ...f,
                group: b.id,
              }))), [])), 'entity', true);
          const tempDiagrams = (dataSourceRef.current?.diagrams || []);
          const tempDiagramKeys = tempDiagrams.map(d => d.defKey);
          const calcDefKey = (defKey) => {
            if (tempDiagramKeys.findIndex(d => d === defKey) > -1) {
              return calcDefKey(`${defKey}1`);
            }
            return defKey;
          };
          // 需要去除id一致的关系图
          const newViewDiagrams = (newData.diagrams || []).map((d) => {
            const newKey = calcDefKey(d.defKey);
            tempDiagramKeys.push(newKey);
            return {
              ...d,
              defKey: calcDefKey(d.defKey),
            };
          });
          const newViewGroups = (newData.viewGroups || []);
          // 2.复制或增量更新分组（包含关系图）
          const injectViewsGroups = [];
          const preViewGroups = (dataSourceRef.current.viewGroups || []).map((g) => {
            const index = newViewGroups.findIndex(ng => ng.defKey === g.defKey);
            if (index > -1) {
              injectViewsGroups.push(g.defKey);
              return {
                ...g,
                refDiagrams: (g.refDiagrams || []).concat(newViewGroups[index]?.refDiagrams || []),
              };
            }
            return g;
          });
          const finalViewGroups = preViewGroups.concat(newViewGroups
              .filter(g => !injectViewsGroups.includes(g.defKey))
            .map(g => ({...g, refEntities: []})));
          const finalDiagrams = tempDiagrams.concat(
            replaceDiagrams(newViewDiagrams, replaceEntities));
          const tempAddEntities = addEntities.map((e) => {
            return {
              ...e,
              id: replaceEntities.filter(r => r.old === e.id)[0]?.new || e.id,
            };
          });
          const commonReplace = {
            entities: replaceEntities,
            dicts: replaceDicts,
            domains: replaceDomains,
            uiHint: replaceUiHint,
          };
          const finalEntities = originEntities.concat(
            replaceEntitiesOrViews(addEntities, commonReplace)
              .map(e => updateHeaders(e, 'entity')));
          const addEntityKeys = tempAddEntities.map(e => e.id);
          const newDataSource = {
            ...dataSourceRef.current,
            profile: {
              ...dataSourceRef.current.profile,
              uiHint,
            },
            entities: finalEntities,
            views: originViews
              .concat(replaceEntitiesOrViews(addViews, commonReplace, finalEntities)
              .map(e => updateHeaders(e, 'view'))),
            dicts,
            domains: replaceDomainsApplyFor(domains, replaceMappings),
            viewGroups: finalViewGroups.map((g) => {
              const currentGroupData = tempAddEntities.filter(d => d.group === g.id).map(d => d.id);
              return {
                ...g,
                refEntities: [...new Set((g.refEntities || [])
                  .filter(e => !addEntityKeys.includes(e))
                  .concat(currentGroupData))],
                refDicts: [...new Set((g.refDicts || []).map((dict) => {
                  return replaceDicts.filter(r => r.old === dict)[0]?.new || dict;
                }))],
                refViews: [...new Set((g.refViews || []).map((view) => {
                  return replaceViews.filter(r => r.old === view)[0]?.new || view;
                }))],
              };
            }),
            diagrams: finalDiagrams,
            dataTypeMapping: {
              ...dataSourceRef.current.dataTypeMapping,
              mappings,
            },
          };
          updateGroupType('modalGroup');
          injectDataSource(newDataSource, modal);
        };
        const allRefEntities = newData.viewGroups.reduce((a, b) => a.concat(b.refEntities), []);
        modal = openModal(<ImportPd
          defaultSelected={newData.diagrams.reduce((a, b) => a
              .concat((b.canvasData?.cells || []).map(c => c.originKey)
                  .filter(c => !!c)), [])}
          customerData={newData.viewGroups.map((g) => {
            return {
              ...g,
              id: dataSourceRef.current.viewGroups
                  ?.filter(group => group.defKey === g.defKey)[0]?.id || g.id,
              fields: (newData.entities || [])
                  .filter(e => (g.refEntities || [])
                      .includes(e.id)),
            };
          }).concat({
            id: '',
            defKey: '',
            defName: FormatMessage.string({id: 'components.select.empty'}),
            fields: newData.entities.filter(e => !allRefEntities.includes(e.id)),
          })}
          ref={importPdRef}
          dataSource={dataSourceRef.current}
        />, {
          bodyStyle: {width: '80%'},
          buttons: [
            <Button type='primary' key='ok' onClick={onOk}><FormatMessage id='button.ok'/></Button>,
            <Button key='cancel' onClick={onCancel}><FormatMessage id='button.cancel'/></Button>],
          title: FormatMessage.string({id: `toolbar.${type === 'chiner' ? 'importCHNR' : 'importPDMan'}`}),
        });
      } catch (err) {
        Modal.error({
          title: FormatMessage.string({id: 'optFail'}),
          message: err.message,
        });
      }
    }, (file) => {
      const result = type === 'chiner' ? file.name.endsWith('.chnr.json') : file.name.endsWith('.pdman.json');
      if (!result) {
        Modal.error({
          title: FormatMessage.string({id: 'optFail'}),
          message: FormatMessage.string({id: type === 'chiner' ? 'invalidCHNRFile' : 'invalidPDManFile'}),
        });
      }
      return result;
    });
  };
  const importFromPb = (type) => {
    Upload(type === 'PD' ? '' : 'text/x-sql', (data) => {
      restProps.openLoading();
      connectDB(dataSourceRef.current, configRef.current, {
        [type === 'PD' ? 'pdmFile' : 'ddlFile']: data.path,
      }, type === 'PD' ? 'ParsePDMFile' : 'ParseDDLToTableImpl', (result) => {
        if (result.status === 'FAILED') {
          const termReady = (term) => {
            term.write(typeof result.body === 'object' ? JSON.stringify(result.body, null, 2)
                : result.body);
          };
          Modal.error({
            bodyStyle: {width: '80%'},
            contentStyle: {width: '100%', height: '100%'},
            title: FormatMessage.string({id: 'optFail'}),
            message: <div>
              <div style={{textAlign: 'center'}}><FormatMessage id='dbConnect.log'/><a onClick={showItemInFolder}>{getLogPath()}</a></div>
              <Terminal termReady={termReady}/>
            </div>,
          });
          restProps.closeLoading();
        } else {
          restProps.closeLoading();
          const [domains] = calcRepeat(dataSourceRef.current.domains,
            calcDomains(result.body?.domains || [], dataSourceRef.current.dataTypeMapping?.mappings, 'defKey'));
          const entities = ((type === 'PD' ? result.body?.tables : result.body) || []).map((t) => {
            const fields = (t.fields || []).map(f => ({...f, id: Math.uuid()}));
            return {
              ...t,
              id: Math.uuid(),
              fields,
            };
          });
          let modal;
          const onCancel = () => {
            modal.close();
          };
          const onOk = () => {
            updateEntities((importPdRef.current.getData()
              .reduce((a, b) => a.concat((b.fields || [])
                .map(f => ({
                  ...f,
                  group: b.id,
                }))), [])), domains, null, modal);
          };
          modal = openModal(<ImportPd
            data={entities}
            ref={importPdRef}
            dataSource={dataSourceRef.current}
          />, {
            bodyStyle: {width: '80%'},
            buttons: [
              <Button type='primary' key='ok' onClick={onOk}><FormatMessage id='button.ok'/></Button>,
              <Button key='cancel' onClick={onCancel}><FormatMessage id='button.cancel'/></Button>],
            title: FormatMessage.string({id: `toolbar.${type === 'PD' ? 'importPowerDesigner' : 'importDDL'}`}),
          });
        }
      });
      //console.log(data);
    }, (file) => {
      const result = type === 'PD' ? (file.name.endsWith('.pdm') || file.name.endsWith('.PDM')) : file.name.endsWith('.sql');
      if (!result) {
        Modal.error({
          title: FormatMessage.string({id: 'optFail'}),
          message: FormatMessage.string({id: type === 'PD' ? 'invalidPdmFile' : 'invalidDDLFile'}),
        });
      }
      return result;
    }, false);
  };
  const calcData = (oldData, newData, keyName = 'id') => {
    return newData.map((d) => {
      const index = oldData.findIndex(o => o.defKey === d.defKey);
      if (index > -1) {
        return {
          ...d,
          [keyName]: oldData[index][keyName],
        };
      }
      return d;
    }).concat(oldData
      .filter(o => newData.findIndex((n) => {
        return n.defKey === o.defKey;
      }) < 0));
  };
  const configFields = ['profile.default.entityInitFields',
    'profile.default.entityInitProperties', 'profile.sql.delimiter', 'profile.generatorDoc.docTemplate',
  'profile.relationFieldSize', 'profile.uiHint', 'profile.modelType', 'profile.relationType'];
  const importConfig = () => {
    Upload('application/json', (d) => {
      const data = JSON.parse(d);
      const codeTemplates = _.get(dataSourceRef.current, 'profile.codeTemplates', []);
      let tempData = dataSourceRef.current;
      configFields.forEach((f) => {
        const oldData = _.get(tempData, f);
        let newData = _.get(data, f, _.get(tempData, f));
        if (f === configFields[5] || f === configFields[0]) {
          newData = newData.map(o => ({...o, id: Math.uuid()}));
          if (f === configFields[0]) {
            newData = newData.map(n => reset(n, dataSourceRef.current, ['defKey', 'id']));
          }
          newData = calcData(oldData, newData);
        }
        tempData = _.set(tempData, f, newData);
      });
      restProps?.update({
        ...tempData,
        profile: {
          ...tempData.profile,
          codeTemplates: 'dictSQLTemplate' in data ? codeTemplates.map((t) => {
            if (t.applyFor === 'dictSQLTemplate' && t.type === 'dbDDL') {
              return data.dictSQLTemplate;
            }
            return t;
          }) : codeTemplates,
        },
      });
      Message.success({title: FormatMessage.string({id: 'optSuccess'})});
    }, (file) => {
      const result = file.name.endsWith('.json');
      if (!result) {
        Modal.error({
          title: FormatMessage.string({id: 'optFail'}),
          message: FormatMessage.string({id: 'invalidConfigFile'}),
        });
      }
      return result;
    });
  };
  const exportConfig = () => {
    let data = {
      ..._.pick(dataSourceRef.current, configFields),
      dictSQLTemplate: _.get(dataSourceRef.current, 'profile.codeTemplates', [])
        .filter(t => t.applyFor === 'dictSQLTemplate' && t.type === 'dbDDL')[0],
    };
    data = _.set(data, configFields[0], _.get(data, configFields[0], [])
      .map(d => reset(d, dataSourceRef.current, ['id', 'defKey'])));
    Download(
      [JSON.stringify(data, null, 2)],
      'application/json',
      `${dataSourceRef.current.name}-${FormatMessage.string({id: 'toolbar.setting'})}-${moment().format('YYYYMDHHmmss')}.json`);

  };
  const exportDomains = () => {
    Download(
      [JSON.stringify({
        codeTemplates: _.get(dataSourceRef.current, 'profile.codeTemplates', [])
          .filter(t => !(t.applyFor === 'dictSQLTemplate' && t.type === 'dbDDL')),
        dataTypeSupports: _.get(dataSourceRef.current, 'profile.dataTypeSupports', []),
        dataTypeMapping:  _.get(dataSourceRef.current, 'dataTypeMapping', []),
        domains: _.get(dataSourceRef.current, 'domains', []),
      }, null, 2)],
      'application/json',
      `${dataSourceRef.current.name}-${FormatMessage.string({id: 'project.domains'})}-${moment().format('YYYYMDHHmmss')}.json`);
  };
  const importDomains = () => {
    Upload('application/json', (d) => {
      const data = JSON.parse(d);
      if (!data.domains) {
        Modal.error({
          title: FormatMessage.string({id: 'optFail'}),
          message: FormatMessage.string({id: 'invalidDomainsFile'}),
        });
      } else {
        const dataTypeSupports = calcData(
          _.get(dataSourceRef.current, 'profile.dataTypeSupports', []),
          _.get(data, 'dataTypeSupports', []).map((t) => {
            if (typeof t === 'string') {
              return {
                defKey: t,
                old: t,
                id: Math.uuid(),
              };
            }
            return {
              ...t,
              old: t.id,
              id: Math.uuid(),
            };
          }));
        const mappings = calcData(
          _.get(dataSourceRef.current, 'dataTypeMapping.mappings', []),
          _.get(data, 'dataTypeMapping.mappings', []).map((m) => {
            return {
              defKey: m.defKey,
              defName: m.defName,
              id: Math.uuid(),
              old: m.id || m.defKey,
              ...dataTypeSupports.reduce((a, b) => {
                return {
                  ...a,
                  [b.id]: m[b.old],
                };
              }, {}),
            };
          }));
        restProps?.update({
          ...dataSourceRef.current,
          profile: {
            ...dataSourceRef.current?.profile,
            dataTypeSupports: dataTypeSupports.map(t => _.omit(t, 'old')),
            codeTemplates: calcData(
              _.get(dataSourceRef.current, 'profile.codeTemplates', []).map(c => ({
                ...c,
                defKey: dataTypeSupports.filter(t => t.old === c.applyFor)[0]?.defKey,
              })),
              _.get(data, 'codeTemplates', [])
                .filter(t => !(t.applyFor === 'dictSQLTemplate' && t.type === 'dbDDL')).map((c) => {
                  const apply = dataTypeSupports.filter(t => t.old === c.applyFor)[0];
                  return {
                    ...c,
                    applyFor: apply?.id,
                    defKey: apply?.defKey,
                  };
              }), 'applyFor').map(c => _.omit(c, 'defKey')),
          },
          dataTypeMapping: {
            ...dataSourceRef.current?.dataTypeMapping,
            mappings: mappings.map(m => _.omit(m, 'old')),
          },
          domains: calcData(
            _.get(dataSourceRef.current, 'domains', []),
            _.get(data, 'domains', []).map((domain) => {
              return {
                ...domain,
                applyFor: mappings.filter(m => m.old === domain.applyFor)[0]?.id,
                id: Math.uuid(),
              };
            }), 'id'),
        });
        Message.success({title: FormatMessage.string({id: 'optSuccess'})});
      }
    }, (file) => {
      const result = file.name.endsWith('.json');
      if (!result) {
        Modal.error({
          title: FormatMessage.string({id: 'optFail'}),
          message: FormatMessage.string({id: 'invalidDomainsFile'}),
        });
      }
      return result;
    });
  };
  const importFromDb = () => {
    // 判断是否已经存在数据库连接
    const dbConn = dataSourceRef.current?.dbConn || [];
    if (dbConn.length === 0) {
      Modal.error({
        title: FormatMessage.string({id: 'optFail'}),
        message: FormatMessage.string({id: 'dbReverseParse.emptyDbConn'}),
      });
    } else {
      let modal;
      const onClose = () => {
        modal && modal.close();
      };
      const onOk = (data, dbKey) => {
        updateEntities(data, dataSourceRef.current.domains, dbKey, modal);
      };
      modal = openModal(<DbReverseParse
        config={configRef.current}
        onOk={onOk}
        onClose={onClose}
        dataSource={dataSourceRef.current}
      />, {
        title: FormatMessage.string({id: 'toolbar.importDb'}),
        bodyStyle: { width: '80%' },
      });
    }
  };
  const exportSql = (type) => {
    let modal;
    const onClose = () => {
      modal && modal.close();
    };
    modal = openModal(<ExportSql templateType={type} dataSource={dataSourceRef.current}/>, {
      title: FormatMessage.string({id: `toolbar.${type === 'dict' ? 'exportDict' : 'exportSql'}`}),
      bodyStyle: { width: '80%' },
      buttons: [
        <Button key='onClose' onClick={onClose}>
          <FormatMessage id='button.close'/>
        </Button>,
      ],
    });
  };
  const createEmptyTable = (e, key) => {
    const cavRef = getCurrentCav();
    cavRef?.startDrag(e, key);
    return cavRef;
  };
  const createNode = (e, type) => {
    const cavRef = getCurrentCav();
    cavRef?.startRemarkDrag(e, type);
  };
  const createGroupNode = (e) => {
    const cavRef = getCurrentCav();
    cavRef?.startGroupNodeDrag(e);
  };
  const createPolygonNode = (e) => {
    const cavRef = getCurrentCav();
    cavRef?.startPolygonNodeDrag(e);
  };
  const createCircleNode = (e) => {
    const cavRef = getCurrentCav();
    cavRef?.createCircleNode(e);
  };
  const domainMenu = useMemo(() => [
    {
      id: 'dataTypeMapping',
      defKey: 'dataTypeMapping',
      type: 'dataTypeMapping',
      icon: 'fa-cube',
      defName: FormatMessage.string({id: 'project.dataTypeMapping'}),
      children: (restProps.dataSource?.dataTypeMapping?.mappings || []).map(d => ({...d, type: 'mapping'})),
    },
    {
      id: 'domains',
      defKey: 'domains',
      type: 'domains',
      icon: 'fa-key',
      defName: FormatMessage.string({id: 'project.domains'}),
      children: (restProps.dataSource?.domains || []).map(d => ({...d, type: 'domain'})),
    },
    {
      id: 'dataTypeSupports',
      defKey: 'dataTypeSupports',
      type: 'dataTypeSupport',
      icon: 'fa-database',
      defName: FormatMessage.string({id: 'project.dataTypeSupport'}),
      children: (restProps.dataSource?.profile?.dataTypeSupports || []).map(d => ({...d, type: 'dataType'})),
    },
  ], [restProps.dataSource, config]);
  const simpleMenu = useMemo(() => [
    {
      id: 'entities',
      defKey: 'entities',
      type: 'entities',
      icon: 'fa-table',
      defName: FormatMessage.string({id: 'project.entities'}),
      children: (restProps.dataSource?.entities || []).map(e => ({...e, type: 'entity'})),
    },
    {
      id: 'views',
      defKey: 'views',
      type: 'views',
      icon: 'icon-shitu',
      defName: FormatMessage.string({id: 'project.views'}),
      children: (restProps.dataSource?.views || []).map(v => ({...v, type: 'view'})),
    },
    {
      id: 'diagrams',
      defKey: 'diagrams',
      type: 'diagrams',
      icon: 'icon-guanxitu',
      defName: FormatMessage.string({id: 'project.diagram'}),
      children: (restProps.dataSource?.diagrams || []).map(d => ({...d, type: 'diagram'})),
    },
    {
      id: 'dicts',
      defKey: 'dicts',
      type: 'dicts',
      icon: 'icon-shujuzidian',
      defName: FormatMessage.string({id: 'project.dicts'}),
      children: (restProps.dataSource?.dicts || []).map(d => ({...d, type: 'dict'})),
    },
  ], [restProps.dataSource, config]);
  const groupMenu = useMemo(() => restProps.dataSource?.viewGroups?.map(v => ({
    ...v,
    type: 'groups',
    icon: 'fa-th-large',
    children: simpleMenu.map(c => ({
      ...c,
      id: `${v.defKey}${separator}${c.defKey}`,
      defKey: `${v.defKey}${separator}${c.defKey}`,
      type: c.defKey,
      children: (v[`ref${c.defKey.slice(0, 1).toUpperCase() + c.defKey.slice(1)}`] || [])
          .map((key) => {
            return c.children.filter(e => e.id === key)[0];
          }).filter(e => !!e),
    })),
  })), [restProps.dataSource, config]);
  const menus = {
    modalAll: simpleMenu,
    modalGroup: groupMenu,
    domains: domainMenu,
  };
  const tabDataChange = (data, t, injectTab) => {
    if (injectTab && (injectTempTabs.current.findIndex(it => it.tabKey === injectTab.tabKey) < 0)) {
      injectTempTabs.current.push(injectTab);
    }
    setDataByTabId(t.tabKey, data);
  };
  const hasRender = (key, instance) => {
    tabInstanceRef.current[key] = instance;
  };
  const hasDestroy = (key) => {
    delete tabInstanceRef.current[key];
  };
  const getDataSource = () => {
    return dataSourceRef.current;
  };
  const otherTabSave = (tab, callback) => {
    saveProject(false, tab, callback);
  };
  const selectionChanged = (cell) => {
    headerToolRef.current.setIsCellSelected(cell.length > 0);
  };
  const jumpEntity = (tabKey) => {
    updateActiveKey(tabKey);
    activeTabStack.current = activeTabStack.current.filter(k => k !== tabKey);
    activeTabStack.current.push(tabKey);
  };
  const getTabComponent = (t) => {
    const type = t.type;
    const key = t.menuKey;
    let group = [];
    if (type === 'entity' || type === 'view'  || type === 'diagram' || type === 'dict') {
      // 需要计算分组信息
      const tempType = type === 'entity' ? 'entities' : `${type}s`;
      const groupRefKey = [`ref${firstUp(tempType)}`];
      group = restProps?.dataSource?.viewGroups?.filter(v => v[groupRefKey]?.includes(key)) || [];
    }
    if (type === 'entity') {
      return (
        <Entity
          type={type}
          getDataSource={getDataSource}
          hasRender={instance => hasRender(t.tabKey, instance)}
          hasDestory={() => hasDestroy(t.tabKey)}
          param={t.param}
          tabKey={t.tabKey}
          common={common}
          updateDataSource={restProps?.update}
          dataSource={restProps?.dataSource}
          openDict={_onMenuClick}
          entity={key}
          group={group}
          tabDataChange={data => tabDataChange(data, t)}
          versionsData={restProps.versionsData[0]}
          />);
    } else if (type === 'view') {
      return <View
        type={type}
        getDataSource={getDataSource}
        updateDataSource={restProps?.update}
        hasRender={instance => hasRender(t.tabKey, instance)}
        hasDestory={() => hasDestroy(t.tabKey)}
        param={t.param}
        tabKey={t.tabKey}
        common={common}
        dataSource={restProps?.dataSource}
        openDict={_onMenuClick}
        entity={key}
        group={group}
        tabDataChange={data => tabDataChange(data, t)}
        versionsData={restProps.versionsData[0]}
      />;
    } else if (type === 'diagram') {
      return <Relation
        jumpEntity={jumpEntity}
        selectionChanged={selectionChanged}
        openDict={_onMenuClick}
        getDataSource={getDataSource}
        common={common}
        save={otherTabSave}
        scaleChange={scaleChange}
        activeKey={activeKey}
        validateTableStatus={validateTableStatus}
        tabKey={t.tabKey}
        diagramKey={key}
        group={group}
        openEntity={_onMenuClick}
        updateDataSource={restProps?.update}
        dataSource={restProps?.dataSource}
        renderReady={cav => renderReady(cav, t.tabKey)}
        tabDataChange={(data, tab) => tabDataChange(data, tab || t, tab)}
        versionsData={restProps.versionsData[0]}
      />;
    } else if (type === 'dict') {
      return <Dict
        param={t.param}
        hasRender={instance => hasRender(t.tabKey, instance)}
        hasDestory={() => hasDestroy(t.tabKey)}
        tabKey={t.tabKey}
        dictKey={key}
        dataSource={restProps?.dataSource}
        tabDataChange={data => tabDataChange(data, t)}
      />;
    }
    return '';
  };
  const tempData = {};
  const _openModal = (name) => {
    let modal = null;
    let Com = '';
    let title = '';
    const onOk = () => {
      if (Object.keys(tempData).length !== 0) {
        let tempDataSource = getDataSource();
        const filterData = ['lang', 'javaHome', 'autoSave', 'jvm', 'autoBackup'];
        if (name === 'dbreverse') {
          const { value = [], realData : { entities = [], viewGroups = [] } = {} }
              = tempData?.dbreverse || {};
          // 此处有多处需要更新
          // 先处理实体和分组信息
          const entitiesKey = (tempDataSource?.entities || [])
              .concat(tempDataSource?.views || [])
              .map(e => e.defKey);
          const newEntities = entities
              .filter(e => value.includes(e.defKey))
              .map((e) => {
                const defKey = validateKey(e.defKey, entitiesKey);
                entitiesKey.push(defKey);
                return {
                  ...e,
                  defKey,
                };
              });
          tempDataSource = {
            ...tempDataSource,
            entities: (tempDataSource?.entities || []).concat(newEntities),
            viewGroups: (tempDataSource?.viewGroups || []).concat({
              ...(viewGroups[0] || {}),
              refEntities: newEntities.map(e => e.defKey),
            }),
          };
          const valueNames = ['domains', 'dataTypeMapping.mappings'];
          valueNames.forEach((n) => {
            const oldKeys = _.get(tempDataSource, n, []).map(d => d.defKey);
            const newData = _.get(tempData, `dbreverse.realData.${n}`, [])
                .filter(d => !oldKeys.includes(d.defKey))
                .map(d => _.omit(d, '__key'));
            tempDataSource = _.set(tempDataSource, n, _.get(tempDataSource, n, []).concat(newData));
          });
        } else if (name === 'dbConnect') {
          if (new Set((tempData.dbConn || [])
            .filter(d => !!d.defName)
            .map(d => d.defName)).size !== (tempData.dbConn || []).length) {
            Modal.error({
              title: FormatMessage.string({id: 'optFail'}),
              message: FormatMessage.string({id: 'dbConnect.validateDb'}),
            });
            return;
          }
        } else if (name === 'config') {
          if ('lang' in tempData && tempData.lang !== lang) {
            // 需要更新一些默认的数据
            const needUpdates = [
              {
                key: 'profile.default.entityInitFields',
                langName: 'entityInitFields',
              },
            ];
            needUpdates.forEach(({key, langName}) => {
              tempDataSource = _.set(tempDataSource, key,
                _.get(tempDataSource, key).map((f) => {
                  return {
                    ...f,
                    defName: FormatMessage.string({id: `projectTemplate.${langName}.${f.defKey}`})
                      || f.defName,
                  };
                }));
            });
          }
          const userData = _.pick(tempData, filterData);
          if (Object.keys(userData).length > 0) {
            restProps?.saveUserData(userData);
          }
        }
        if ('dictSQLTemplate' in tempData) {
          const path = 'profile.codeTemplates';
          const codeTemplates = _.get(tempDataSource, path, []);
          if (codeTemplates.findIndex(c => c.applyFor === 'dictSQLTemplate') < 0) {
            codeTemplates.push(emptyDictSQLTemplate);
          }
          tempDataSource = _.set(tempDataSource, path, codeTemplates
            .map((c) => {
              if (c.applyFor === 'dictSQLTemplate') {
                return {
                  ...c,
                  content: tempData.dictSQLTemplate || '',
                };
              }
              return c;
            }));
        }
        filterData.splice(0, 0, 'dictSQLTemplate');
        Object.keys(tempData).filter(f => !filterData.includes(f)).forEach((f) => {
          tempDataSource = _.set(tempDataSource, f, tempData[f]);
        });
        restProps?.save(tempDataSource, FormatMessage.string({id: 'saveProject'}), !projectInfoRef.current); // 配置项内容在关闭弹窗后自动保存
      }
      modal && modal.close();
    };
    const onCancel = () => {
      modal && modal.close();
    };
    if (name === 'config'){
      Com = Config;
      title = FormatMessage.string({id: 'config.title'});
    } else {
      Com = DbConnect;
      title = FormatMessage.string({id: 'dbConnect.title'});
    }
    const dataChange = (value, fieldName) => {
      tempData[fieldName] = value;
    };
    modal = openModal(<Com
      config={config}
      lang={config.lang}
      dataChange={dataChange}
      prefix={prefix}
      getDataSource={getDataSource}
      dataSource={restProps?.dataSource}
      updateDataSource={restProps.update}
    />, {
      bodyStyle: { width: '80%' },
      title,
      buttons: [<Button type='primary' key='ok' onClick={() => onOk(modal)}>
        <FormatMessage id='button.ok'/>
      </Button>,
        <Button key='cancel' onClick={() => onCancel(modal)}>
          <FormatMessage id='button.cancel'/>
        </Button>],
    });
  };
  const domainGetName = (m) => {
    const dataTypeSupports = _.get(restProps, 'dataSource.profile.dataTypeSupports', []);
    const defaultDb = _.get(restProps, 'dataSource.profile.default.db', dataTypeSupports[0]?.id);
    if (defaultDb === m.id) {
      return `${m.defName || m.defKey}(${FormatMessage.string({id: 'project.default'})})`;
    }
    return m.defName || m.defKey;
  };
  const getName = (m) => {
    if (m.defKey !== m.defName) {
      if (m.type === 'groups'){
        return `${m.defKey}-${m.defName || m.defKey}`;
      } else if (m.type === 'entity' || m.type === 'view' || m.type === 'diagram' || m.type === 'dict'){
        if (m.defName) {
          const tempDisplayMode = m.nameTemplate || '{defKey}[{defName}]';
          return tempDisplayMode.replace(/\{(\w+)\}/g, (match, word) => {
            return m[word] || m.defKey || '';
          });
        }
        return m.defKey;
      }
      return m.defName;
    }
    return m.defName;
  };
  const _colorChange = (key, value) => {
    // 颜色发生变化
    const cavRef = getCurrentCav();
    cavRef.updateColor(key, value);
  };
  const iconClick = (e, key) => {
    console.log(key);
    switch (key) {
      case 'save': saveProject();break;
      case 'refresh': refreshProject();break;
      case 'saveAs': saveProject(true);break;
      case 'pdman': importFromPDMan('pdman');break;
      case 'importDDL': importFromPb('DDL');break;
      case 'chiner': importFromPDMan('chiner');break;
      case 'powerdesigner': importFromPb('PD');break;
      case 'db': importFromDb();break;
      case 'domains': importDomains();break;
      case 'exportDomains': exportDomains();break;
      case 'importConfig': importConfig();break;
      case 'exportConfig': exportConfig();break;
      case 'undo': undo(); break;
      case 'redo': redo(); break;
      case 'img': exportImg(); break;
      case 'word': exportWord(); break;
      case 'sql': exportSql('sql'); break;
      case 'dict': exportSql('dict'); break;
      case 'empty': createEmptyTable(e);break;
      case 'round': createNode(e, 'round');break;
      case 'circle': createCircleNode(e);break;
      case 'rect': createNode(e, 'rect');break;
      case 'polygon': createPolygonNode(e);break;
      case 'group': createGroupNode(e);break;
      default: break;
    }
  };
  // 在过滤为空的数据
  const tempMenu = menus[groupType];
  const currentPrefix = getPrefix(prefix);
  const getTabTitle = (t) => {
    const currentType = allType.filter(a => a.type === t.type)[0];
    const currentData = restProps?.dataSource[currentType.name]?.
    filter(d => d.id === t.menuKey)[0];
    const tempDisplayMode = currentData?.nameTemplate || '{defKey}[{defName}]';
    return {
      title: currentData?.defName || currentData?.defKey,
      tooltip: tempDisplayMode.replace(/\{(\w+)\}/g, (match, word) => {
        return currentData?.[word] || currentData?.defKey || '';
      }),
    };
  };
  const standardFieldMemo = useMemo(() => {
    return <StandardField
      ref={standardFieldRef}
      activeKey={activeKey}
      dataSource={restProps.dataSource}
      updateDataSource={restProps.update}
    />;
  }, [restProps.dataSource, activeKey]);
  const dropDownMenus = useMemo(() => ([
    {key: 'closeCurrent', name: FormatMessage.string({id: 'closeCurrent'})},
    {key: 'closeOthers', name: FormatMessage.string({id: 'closeOthers'})},
    {key: 'closeAll', name: FormatMessage.string({id: 'closeAll'})},
  ]),[]);
  const dropDownMenuClick = (m, e, c) => {
    switch (m.key){
      case 'closeCurrent':
        _tabClose(c.key);
        break;
      case 'closeOthers':
        _tabCloseOther(c.key);
        break;
      case 'closeAll':
        _tabCloseAll();
        break;
      default: break;
    }
  };
  const _menuTypeChange = (key) => {
    if (key === '1') {
      currentMenu.current = menuModelRef.current;
    } else {
      currentMenu.current = menuDomainRef.current;
    }
    setMenuType(key);
    resizeContainer.current.style.minWidth = `${menuNorWidth + menuMinWidth}px`;
    resizeContainer.current.style.width = `${menuNorWidth + menuMinWidth}px`;
  };
  const _jumpPosition = (d, key) => {
    setMenuType('1');
    if ((d.groups || []).length > 0) {
      updateGroupType('modalGroup');
    } else {
      updateGroupType('modalAll');
    }
    menuModelRef.current?.jumpPosition(d, key);
  };
  const _jumpDetail = (d, key) => {
    if (key === 'standardFields') {
      standardFieldRef.current?.openEdit(d);
    } else {
      setMenuType('1');
      if ((d.groups || []).length > 0) {
        updateGroupType('modalGroup');
      } else {
        updateGroupType('modalAll');
      }
      menuModelRef.current?.jumpDetail(d, key);
    }
  };
  const onMouseDown = (e) => {
    isResize.current = {
      status: true,
      width: resizeContainer.current.getBoundingClientRect().width,
      x: e.clientX,
    };
  };
  const onMouseMove = (e) => {
    if (isResize.current.status) {
      const width = isResize.current.width + (e.clientX - isResize.current.x);
      if (width < (window.innerWidth - 10) && width > menuContainerWidth) {
        resizeContainer.current.style.width = `${width}px`;
        resizeOther.current.style.width = `calc(100% - ${width}px)`;
        menuContainerModel.current.style.width = `${width - menuMinWidth}px`;
        menuContainerDataType.current.style.width = `${width - menuMinWidth}px`;
      }
    }
  };
  const onMouseUp = () => {
    if (isResize.current.status) {
      restProps?.save({
        ...dataSourceRef.current,
        profile: {
          ...dataSourceRef.current.profile,
          menuWidth: menuContainerModel.current.style.width,
        },
      }, FormatMessage.string({id: 'saveProject'}), !projectInfoRef.current);
    }
    isResize.current.status = false;
  };
  const fold = () => {
    setMenuType('3');
    resizeContainer.current.style.minWidth = `${menuMinWidth}px`;
    resizeContainer.current.style.width = `${menuMinWidth}px`;
  };
  useEffect(() => {
    const id = Math.uuid();
    addBodyEvent('onmousemove', id, onMouseMove);
    addBodyEvent('onmouseup', id, onMouseUp);
    addBodyEvent('onmouseleave', id,  onMouseUp);
    return () => {
      removeBodyEvent('onmousemove', id);
      removeBodyEvent('onmouseup', id);
      removeBodyEvent('onmouseleave', id);
    };
  }, []);
  useEffect(() => {
    const clear = () => {
      if (autoSaveRef.current) {
        clearInterval(autoSaveRef.current);
      }
    };
    clear();
    if (config.autoSave && projectInfoRef.current) {
      // 开始执行自动保存任务
      autoSaveRef.current = setInterval(() => {
        console.log('autoSave');
        const newData = updateAllData(dataSourceRef.current,
          injectTempTabs.current.concat(tabsRef.current));
        if (newData.result.status) {
          restProps.autoSave(newData.dataSource);
        } else {
          restProps.autoSave(dataSourceRef.current);
        }
      }, config.autoSave * 60 * 1000);
    }
    return () => {
      // 结束执行自动保存任务
      clear();
    };
  }, [config.autoSave]);
  const createGroupMenu = getMenu('add', '', 'groups', [], groupType, '');
  console.log(tabs);
  return <Loading visible={common.loading} title={common.title}>
    <HeaderTool
      dataSource={restProps.dataSource}
      ref={headerToolRef}
      currentPrefix={currentPrefix}
      close={restProps.close}
      iconClick={iconClick}
      activeTab={activeTab}
      resize={resize}
      sliderChange={sliderChange}
      colorChange={_colorChange}
      openModal={_openModal}
      jumpPosition={_jumpPosition}
      jumpDetail={_jumpDetail}
    />
    <div className={`${currentPrefix}-home`}>
      <div
        className={`${currentPrefix}-home-resize-container`}
        ref={resizeContainer}
        style={{
          width: menuNorWidth + menuMinWidth,
        }}>
        {
          menuType !== '3' && <span
            onClick={fold}
            className={`${currentPrefix}-home-fold`}
          >
            <Icon type='fa-angle-double-left '/>
          </span>
        }
        <Tab activeKey={menuType} onChange={_menuTypeChange}>
          <TabItem key='1' title={FormatMessage.string({id: 'modelTab'})} icon='model.svg'>
            <div
              ref={menuContainerModel}
              className={`${currentPrefix}-home-menu-container`}
            >
              <div className={`${currentPrefix}-home-menu-header`}>
                <span className={`${currentPrefix}-home-menu-header-title`}>
                  <FormatMessage id='moduleList'/>
                </span>
                <span onClick={_groupMenuChange} className={`${currentPrefix}-home-menu-header-opt`}>
                  <span>
                    <Tooltip
                      title={<div
                        className={`${currentPrefix}-home-menu-header-opt-title`}
                        >
                        <FormatMessage id='hiddenGroupInfo'/>
                      </div>}
                      force
                      placement='top'
                    >
                      <Icon type='icon-xinxi'/>
                    </Tooltip>
                  </span>
                  <span>
                    <FormatMessage id='hiddenGroup'/>
                  </span>
                  <span>
                    <Checkbox onChange={_groupMenuChange} checked={groupType === 'modalAll'}/>
                  </span>
                </span>
              </div>
              <Menu
                ref={menuModelRef}
                prefix={prefix}
                {...restProps}
                menus={tempMenu}
                doubleMenuClick={_onMenuClick}
                onContextMenu={_onContextMenu}
                contextMenus={contextMenus}
                contextMenuClick={_contextMenuClick}
                draggable={draggable}
                getName={getName}
                dragTable={createEmptyTable}
                groupType={groupType}
                emptyData={<div
                  onClick={() => _contextMenuClick(null, createGroupMenu)}
                  className={`${currentPrefix}-home-menu-empty`}
                  >
                  <FormatMessage id='emptyGroup'/>
                </div>}
              />
            </div>
          </TabItem>
          <TabItem key='2' title={FormatMessage.string({id: 'domainTab'})} icon='data_type.svg'>
            <div
              ref={menuContainerDataType}
              className={`${currentPrefix}-home-menu-container`}
            >
              <div className={`${currentPrefix}-home-menu-header`}>
                <span className={`${currentPrefix}-home-menu-header-title`}>
                  <FormatMessage id='project.domains'/>
                </span>
              </div>
              <Menu
                ref={menuDomainRef}
                prefix={prefix}
                {...restProps}
                onContextMenu={_onContextMenu}
                contextMenus={contextMenus}
                contextMenuClick={_contextMenuClick}
                menus={menus.domains}
                getName={domainGetName}
                draggable={draggable}
                dragTable={createEmptyTable}
                doubleMenuClick={(key, type, parentKey) => _contextMenuClick(null,
                      getMenu('edit', key, type, [], groupType, parentKey))}
              />
            </div>
          </TabItem>
        </Tab>
        {
          menuType !== '3' && <div
            onMouseDown={onMouseDown}
            className={`${currentPrefix}-home-resize-container-line`}
          >
            {}
          </div>
        }
      </div>
      <div
        className={`${currentPrefix}-home-resize-other`}
        ref={resizeOther}
        style={{width: `calc(100% - ${menuNorWidth + menuMinWidth}px)`}}
      >
        {
          <Tab
            key={mainId}
            menuClick={dropDownMenuClick}
            dropDownMenus={dropDownMenus}
            position='top'
            activeKey={activeKey}
            closeTab={_tabClose}
            onChange={_tabChange}
            excess={standardFieldMemo}
            empty={<MessageHelp prefix={currentPrefix}/>}
          >
            {tabs.map((t) => {
              const title = getTabTitle(t);
              return (
                <TabItem
                  style={t.style}
                  key={t.tabKey}
                  title={title.title}
                  tooltip={title.tooltip}
                  icon={t.icon}
                  >
                  {getTabComponent(t)}
                </TabItem>
              );
            })}
          </Tab>
        }
      </div>
    </div>
  </Loading>;
});

export default Index;
