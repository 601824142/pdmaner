import React, { useState } from 'react';
import _ from 'lodash/object';

import {Icon, Modal, openModal, Button, FormatMessage, SearchInput, Tooltip } from 'components';
// eslint-disable-next-line import/extensions,import/named

// eslint-disable-next-line import/named
import { platform } from '../../lib/middle';
import ProjectEdit from '../container/projectedit';
import {getPrefix} from '../../lib/prefixUtil';
import { version } from '../../../package';
import { openUrl } from '../../lib/json2code_util';

import * as template from '../../lib/template';

const CodeImg = ({currentPrefix}) => {
  return <div className={`${currentPrefix}-home-container-codeimg`}>
    <div><FormatMessage id='home.optBookTitle'/></div>
    <div>
      <div>
        <img src='./asset/codeimage/img.png' alt=''/>
        <span><FormatMessage id='home.optBookTitle1'/></span>
      </div>
      {/*<p/>*/}
      {/*<div>*/}
      {/*  <img src='./asset/codeimage/app.jpeg' alt=''/>*/}
      {/*  <span><FormatMessage id='home.optBookTitle2'/></span>*/}
      {/*</div>*/}
    </div>
  </div>;
};

export default React.memo(({prefix, importProject, createProject, openTemplate,
                             renameProject, updateHistory, deleteProject, lang, config}) => {
  const currentPrefix = getPrefix(prefix);
  const [searchValue, setSearchValue] = useState('');
  const proInfo = (h) => {
    Modal.info({
      title: FormatMessage.string({id: 'home.proInfo'}),
      message: <ProjectEdit data={h} reading lang={lang}/>,
      contentStyle: {
        height: '60vh',
        overflow: 'auto',
      },
    });
  };
  const _createProject = (projectData) => {
    let modal = null;
    let newDataSource = {};
    let oldData = {};
    const onOk = () => {
      if (!newDataSource.name || (!newDataSource.path && platform === 'json')) {
        Modal.error({
          title: FormatMessage.string({id: 'optFail'}),
          message: FormatMessage.string({id: 'formValidateMessage'}),
        });
      } else {
        if (projectData && Object.keys(oldData).length > 0){
          renameProject(newDataSource, oldData, projectData);
        } else {
          if (!newDataSource.describe){
            newDataSource.describe = newDataSource.name;
          }
          createProject(_.omit(newDataSource, ['path']), newDataSource.path);
        }
        modal && modal.close();
      }
    };
    const onCancel = () => {
      modal && modal.close();
    };
    const onChange = (project) => {
      newDataSource = project;
    };
    const dataFinish = (data) => {
      if (data) {
        newDataSource = data;
        oldData = data;
      } else {
        modal && modal.close();
      }
    };
    modal = openModal(<ProjectEdit
      data={projectData}
      lang={lang}
      onChange={onChange}
      dataFinish={dataFinish}
    />, {
      title: projectData?.name ? FormatMessage.string({id: 'home.editProject'})
        : FormatMessage.string({id: 'home.createProject'}),
      buttons: [<Button type='primary' key='ok' onClick={onOk}>
        <FormatMessage id='button.ok'/>
      </Button>,
        <Button key='onCancel' onClick={onCancel}>
          <FormatMessage id='button.cancel'/>
        </Button>],
    });
  };
  const proConfig = (h) => {
    _createProject(h);
  };
  const removeHistory = (h) => {
    updateHistory('remove', h);
  };
  const removeProject = (h) => {
    Modal.confirm({
      title: FormatMessage.string({id: 'deleteConfirmTitle'}),
      message: FormatMessage.string({id: 'deleteFromDiskConfirm'}),
      lang,
      onOk:() => {
        deleteProject(h);
      },
    });
  };
  const openTemplateClick = (data, t) => {
    openTemplate(data, t);
  };
  const onProjectClick = (h) => {
    importProject(h.path);
  };
  const _menuClick = (m, p) => {
    if (m.key === 'removeHistory') {
      removeHistory(p);
    } else {
      removeProject(p);
    }
  };
  const onMouseOver = (e) => {
    const target = e.currentTarget;
    const child = target.children[1];
    child.style.display = 'block';
  };
  const onMouseLeave = (e) => {
    const target = e.currentTarget;
    target.children[1].style.display = 'none';
  };
  const onChange = (e) => {
    setSearchValue(e.target.value);
  };
  const Tool = ({p}) => {
    const dropDownMenus = [
      {key: 'removeHistory', name: FormatMessage.string({id: 'home.removeHistory'})},
      {key: 'removeProject', name: FormatMessage.string({id: 'home.removeProject'})},
    ];
    return  <div className={`${currentPrefix}-home-container-body-right-list-tab-item-tool`}>
      <span><Icon type='icon-xinxi' onClick={() => proInfo(p)}/></span>
      <span><Icon type='edit.svg' onClick={() => proConfig(p)}/></span>
      <span
        onMouseOver={onMouseOver}
        onMouseLeave={onMouseLeave}
      >
        <span
        >
          <Icon
            type='more.svg'
          />
        </span>
        <span>
          {
              dropDownMenus.map((m) => {
                return <div key={m.key} onClick={() => _menuClick(m, p)}>{m.name}</div>;
              })
            }
        </span>
      </span>
    </div>;
  };
  const reg = new RegExp((searchValue || '').replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
  return <div className={`${currentPrefix}-home-container`}>
    <div className={`${currentPrefix}-home-container-body`}>
      <div className={`${currentPrefix}-home-container-body-left`}>
        <div className={`${currentPrefix}-home-container-body-left-logo`}>
          <div className={`${currentPrefix}-home-container-body-left-logo-icon`}>
            {}
          </div>
          <div className={`${currentPrefix}-home-container-body-left-logo-title`}>
            {/*<span>CHINER</span>*/}
            <span>
              <FormatMessage id='system.title'/>
            </span>
            <span>v{version}</span>
          </div>
        </div>
        <div className={`${currentPrefix}-home-container-body-left-opt`}>
          <div
            className={`${currentPrefix}-home-container-body-left-opt-item`}
            onClick={() => _createProject()}
          >
            <div className={`${currentPrefix}-home-container-body-left-opt-item-icon`}>
              <div className={`${currentPrefix}-home-container-body-left-opt-item-icon-bg`}>
                <Icon type='fa-plus '/>
              </div>
            </div>
            <div
              className={`${currentPrefix}-home-container-body-left-opt-item-title`}
            >
              <FormatMessage id='toolbar.create'/>
            </div>
          </div>
          <div
            className={`${currentPrefix}-home-container-body-left-opt-item`}
            onClick={() => importProject()}
          >
            <div className={`${currentPrefix}-home-container-body-left-opt-item-icon`}>
              <Icon type='fa-folder-open'/>
            </div>
            <div className={`${currentPrefix}-home-container-body-left-opt-item-title`}>
              <FormatMessage id='toolbar.open'/>
            </div>
          </div>
          <div
            className={`${currentPrefix}-home-container-body-left-opt-item ${currentPrefix}-home-container-body-left-opt-item-selected`}
          >
            <div className={`${currentPrefix}-home-container-body-left-opt-item-icon`}>
              <Icon type='fa-folder'/>
            </div>
            <div className={`${currentPrefix}-home-container-body-left-opt-item-title`}>
              <FormatMessage id='home.project'/>
            </div>
          </div>
        </div>
      </div>
      <div className={`${currentPrefix}-home-container-body-right`}>
        <div className={`${currentPrefix}-home-container-body-right-nav`}>
          <div className={`${currentPrefix}-home-container-body-right-nav-search`}>
            <SearchInput placeholder={FormatMessage.string({id: 'home.search'})} onChange={onChange}/>
          </div>
          <div className={`${currentPrefix}-home-container-body-right-nav-type`}>
            <div
              className={`${currentPrefix}-home-container-body-right-nav-type-selected`}
            >
              <Icon type='icon-quanbuxiangmu' style={{marginRight: 4}}/>
              <FormatMessage id='home.allProject'/>
            </div>
            <Tooltip placement='bottom' title={<CodeImg currentPrefix={currentPrefix}/>} force>
              <div
                title={FormatMessage.string({id: 'home.jumpOptBook'})}
                onClick={() => openUrl('https://www.yuque.com/pdmaner/docs')}
                className={`${currentPrefix}-home-container-body-right-nav-type-unselected`}
              >
                <Icon type='fa-book' style={{marginRight: 4, fontSize: '16px'}}/>
                <FormatMessage id='home.optBook'/>
              </div>
            </Tooltip>
          </div>
        </div>
        <div className={`${currentPrefix}-home-container-body-right-list`}>
          <div>
            <div className={`${currentPrefix}-home-container-body-right-ad-container`}>
              <div className={`${currentPrefix}-home-container-body-right-list-title`}>
                <FormatMessage id='home.allProject'/>
              </div>
              <div onClick={() => openUrl('https://www.wjx.cn/vj/PIZj3DI.aspx')} className={`${currentPrefix}-home-container-body-right-ad`}>
                <Icon type='fa-bullhorn'/>
                <span>
                  企业版预订登记，前999名，享受最低三折起折扣优惠
                </span>
              </div>
            </div>
            <div className={`${currentPrefix}-home-container-body-right-list-tab`}>
              <div className={`${currentPrefix}-home-container-body-right-list-tab-header`}>
                <div
                  className={`${currentPrefix}-home-container-body-right-list-tab-header-title
                 ${currentPrefix}-home-container-body-right-list-tab-header-title-selected`}
                >
                  <FormatMessage id='home.recently'/>
                </div>
              </div>
              <div className={`${currentPrefix}-home-container-body-right-list-tab-content`}>
                {
                  config?.data[0]?.projectHistories?.
                  filter(p => reg.test(p.describe || '') || reg.test(p.name || '')).
                  map((p) => {
                    return <Tooltip
                      offsetLeft={-18}
                      offsetTop={-2}
                      force
                      title={<Tool p={p}/>}
                      placement='top'
                      key={p.path}
                      className={`${currentPrefix}-home-container-body-right-list-tab-item-tooltip`}
                    >
                      <div
                        onClick={() => onProjectClick(p)}
                        className={`${currentPrefix}-home-container-body-right-list-tab-item`}
                      >
                        <div className={`${currentPrefix}-home-container-body-right-list-tab-item-title`}>
                          {p.name}
                        </div>
                        <div className={`${currentPrefix}-home-container-body-right-list-tab-item-body`}>
                          <div className={`${currentPrefix}-home-container-body-right-list-tab-item-body-icon`}>
                            {p.avatar ? <img src={p.avatar} alt='avatar'/> : <Icon type='fa-file'/>}
                          </div>
                          <div className={`${currentPrefix}-home-container-body-right-list-tab-item-body-desc`}>
                            {p.describe}
                          </div>
                        </div>
                      </div>
                    </Tooltip>;
                  })
                }
              </div>
            </div>
          </div>
          <div>
            <div className={`${currentPrefix}-home-container-body-right-list-title`}>
              <FormatMessage id='home.exampleProject'/>
            </div>
            <div className={`${currentPrefix}-home-container-body-right-list-tab-content`}>
              {
                Object.keys(template).map((t) => {
                  const p = template[t];
                  return <div
                    key={p.name}
                    onClick={() => openTemplateClick(p, t)}
                    className={`${currentPrefix}-home-container-body-right-list-tab-item`}
                  >
                    <div className={`${currentPrefix}-home-container-body-right-list-tab-item-title`}>
                      {p.name}
                    </div>
                    <div className={`${currentPrefix}-home-container-body-right-list-tab-item-body`}>
                      <div className={`${currentPrefix}-home-container-body-right-list-tab-item-body-icon`}>
                        {p.avatar ? <img src={p.avatar} alt='avatar'/> : <Icon type='fa-file'/>}
                      </div>
                      <div className={`${currentPrefix}-home-container-body-right-list-tab-item-body-desc`}>
                        {p.describe}
                      </div>
                    </div>
                  </div>;
                })
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>;
});
