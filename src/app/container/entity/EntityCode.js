import React, {useRef} from 'react';
import * as _ from 'lodash/object';

import {SimpleTab, CodeHighlight, FormatMessage, Button, openModal, Modal, CodeEditor} from 'components';
//import { separator } from '../../../../profile';
import { getCodeByDataTable } from '../../../lib/json2code_util';
import {getPrefix} from '../../../lib/prefixUtil';
import PathEnvEdit from './PathEnvEdit';
import { saveAllTemplate } from '../../../lib/middle';
import {defaultTemplate, transformTable} from '../../../lib/datasource_util';

const CodeContent = React.memo(({ data, dataSource, group, codeType, codeTemplate,
                                    getConfig, saveUserData, dataChange, prefix,
                                    updateDataSource, getDataSource}) => {
    const dataRef = useRef(data);
    dataRef.current = data;
    const dataSourceRef = useRef(dataSource);
    dataSourceRef.current = dataSource;
  const currentPrefix = getPrefix(prefix);
  const template = codeTemplate.type === 'dbDDL' ? defaultTemplate.dbDDLTemplate.filter((t) => {
      if (codeType === 'view') {
        return t !== 'createTable';
      }
      return t !== 'createView';
    }) : Object.keys(_.omit(codeTemplate, ['type', 'applyFor', 'isDefault', 'id', 'defKey']));
  const CustomerTitle = () => {
      const editRef = useRef(null);
      const genFile = (btn, env , path, modal) => {
          btn.updateStatus('disable');
          const dataEnv = env || data.env || {};
          const filePath = path || getConfig()?.path?.[data.id] || '';
          if (!filePath) {
              Modal.error({
                  title: FormatMessage.string({id: 'optFail'}),
                  message: FormatMessage.string({id: 'tableBase.emptySavePath'}),
              });
              btn.updateStatus('normal');
          } else {
              saveAllTemplate(getCodeByDataTable(dataSource, group, {
                  ...data,
                  env: {
                      ...dataEnv,
                  },
              }, codeTemplate.id), filePath).then((res) => {
                  btn.updateStatus('normal');
                  modal && modal.close();
                  Modal.success({
                      title: FormatMessage.string({id: 'tableBase.genFileSuccess'}),
                      message: <div>
                        {res.map((r) => {
                              return <div key={r}>{r}</div>;
                          })}
                      </div>,
                      bodyStyle: {width: '80%'},
                      contentStyle: {width: '100%'},
                  });
              }).catch((err) => {
                  btn.updateStatus('normal');
                  Modal.error({
                      title: FormatMessage.string({id: 'optFail'}),
                      message: err,
                  });
              });
          }
      };
      const openConfig = () => {
          let modal;
          const onOK = (btn, type) => {
              const env = editRef.current.getData();
              const path = editRef.current.getPath();
              const config = getConfig();
              saveUserData({
                  ...config,
                  path: {
                      ...config.path,
                      [data.id]: path,
                  },
              });
              const tempDataSource = getDataSource();
              const name = codeType === 'view' ? 'views' : 'entities';
              updateDataSource({
                  ...tempDataSource,
                  [name]: (tempDataSource[name] || []).map((e) => {
                      if (e.id === data.id) {
                          return {
                              ...e,
                              env,
                          };
                      }
                      return e;
                  }),
              });
              dataChange(env, 'env');
              if (type){
                  genFile(btn, env, path, modal);
              }
              modal.close();
          };
          const onCancel = () => {
              modal.close();
          };
          modal = openModal(<PathEnvEdit
            codeTemplate={codeTemplate}
            template={template}
            dataSource={dataSource}
            ref={editRef}
            data={data}
            config={getConfig()}
          />, {
              bodyStyle: {width: '60%'},
              title: FormatMessage.string({id: 'tableBase.pathAndEnvEdit'}),
              buttons: [
                <Button type='primary' key='ok' onClick={(e, btn) => onOK(btn)}>{FormatMessage.string({id: 'button.ok'})}</Button>,
                <Button type='primary' key='okAndSave' onClick={(e, btn) => onOK(btn, 'all')}>{FormatMessage.string({id: 'tableBase.saveAndGenerate'})}</Button>,
                <Button key='cancel' onClick={onCancel}>{FormatMessage.string({id: 'button.cancel'})}</Button>],
          });
      };
      return <div>
        <div>
          <Button key='onOK' onClick={openConfig}><FormatMessage id='tableBase.pathAndEnv'/></Button>
        </div>
        <div style={{marginTop: 5}}>
          <Button
            style={{display: 'inline-block', width: '100%'}}
            key='onOK'
            onClick={(e, btn) => genFile(btn)}
          >
            <FormatMessage id='tableBase.generate'/>
          </Button>
        </div>
      </div>;
  };
  const CustomerFooter = () => {
    const showModelData = () => {
        let modal;
        const onCancel = () => {
            modal.close();
        };
        modal = openModal(<CodeEditor
          style={{marginBottom: 10}}
          readOnly
          mode='json'
          width='100%'
          height='70vh'
          value={JSON.stringify(transformTable(dataRef.current, dataSourceRef.current, codeTemplate.id, 'id', codeTemplate.type), null, 2)}
        />, {
            bodyStyle: {width: '60%'},
            title: FormatMessage.string({id: 'tableBase.model'}),
            buttons: [
              <Button key='cancel' onClick={onCancel}>{FormatMessage.string({id: 'button.close'})}</Button>],
        });
    };
    return  <div className={`${currentPrefix}-entity-template-footer`}><Button key='onOK' onClick={showModelData}><FormatMessage id='tableBase.model'/></Button></div>;
  };
  return <SimpleTab
    offsetHeight={30}
    customerTitle={codeTemplate.type === 'appCode' ? <CustomerTitle/> : ''}
    customerFooter={<CustomerFooter/>}
    type='left'
    options={template
      .map((d) => {
        // 过滤无效的变更信息
        return {
          key: d,
          title: codeTemplate.type === 'dbDDL' ? <FormatMessage id={`tableTemplate.${d}`} defaultMessage={d}/> : d,
          content: <CodeHighlight
            mode={d === 'content' ? 'java' : 'mysql'}
            data={() => getCodeByDataTable(dataSource, group, data, codeTemplate.id, d)}
          />,
        };
      })}
  />;
});

export default React.memo(({ dataSource, data, prefix, type, tabName, codeType, ...restProps }) => {
  const dataTypeSupport = _.get(dataSource, 'profile.dataTypeSupports', []);
  const codeTemplates = _.get(dataSource, 'profile.codeTemplates', []);
 /* // 过滤当前的实体变更信息
  const currentChanges = changes.filter(c => c.name.split(separator)[0] === data.defKey);*/
  const currentPrefix = getPrefix(prefix);
  return <div className={`${currentPrefix}-entity-code`}>
    <SimpleTab
      defaultActive={dataSource?.profile?.default?.db}
      type='block'
      options={dataTypeSupport
        .map((d) => {
            return {
                ...d,
                ...codeTemplates.filter(c => c.applyFor === d.id)[0],
            };
        })
        .filter(d => d.type === codeType)
        .map(d => ({
          key: d.id,
          title: d.defKey,
          content: <CodeContent
            codeType={type}
            data={data}
            codeTemplate={d}
            dataSource={dataSource}
            {...restProps}
          />,
        }))}
    />
  </div>;
});
