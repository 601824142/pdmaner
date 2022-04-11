import React, { useState } from 'react';
import {CodeHighlight, CodeEditor, FormatMessage, openModal, Button} from 'components';

import {getDemoTemplateData, getDataByTemplate} from '../../../lib/json2code_util';
import { transform } from '../../../lib/datasource_util';
import './style/index.less';
import {getPrefix} from '../../../lib/prefixUtil';
import DotHelp from './DotHelp';

export default React.memo(({prefix, template, mode, templateShow = 'createTable', db, dataSource, templateChange}) => {
  const style = {width: 'auto', height: 'calc(100vh - 80px)'};
  const openDotHelp = () => {
    let modal;
    const onClose = () => {
      modal && modal.close();
    };
    modal = openModal(<DotHelp/>, {
      bodyStyle: {width: '80%'},
      title: <FormatMessage id='database.preview.dot'/>,
      buttons: [
        <Button key='close' onClick={onClose}>
          <FormatMessage id='button.close'/>
        </Button>],
    });
  };
  let demoData = getDemoTemplateData(templateShow);
  const [templateData, updateTemplate] = useState(template);
  const getDemoJson = () => {
    let jsonData = JSON.parse(demoData);
    if ('view' in jsonData || 'entity' in jsonData) {
      const name = 'view' in jsonData ? 'view' : 'entity';
      jsonData = {
        ...jsonData,
        [name]: {
          ...jsonData[name],
          fields: jsonData[name].fields ? (jsonData[name].fields || []).map((f) => {
            return {
              ...f,
              ...transform(f, dataSource, db, 'defKey'),
            };
          }) : undefined,
        },
      };
    }
    return jsonData;
  };
  const [data, updateJsonData] = useState(() => {
    return JSON.stringify(getDemoJson(), null, 2);
  });
  const getJsonData = () => {
    let jsonData;
    try {
      jsonData = JSON.parse(data);
    } catch (e) {
      jsonData = getDemoJson();
    }
    return jsonData;
  };
  const _updateTemplate = (value) => {
    updateTemplate(value);
    templateChange && templateChange(value);
  };
  const demoCode = getDataByTemplate(getJsonData(), templateData || '', true, dataSource, db);
  const currentPrefix = getPrefix(prefix);
  return <div className={`${currentPrefix}-preview`}>
    <div className={`${currentPrefix}-preview-left`}>
      <span className={`${currentPrefix}-preview-left-title`}>
        <FormatMessage id='database.preview.demoData'/>
      </span>
      <CodeHighlight style={style} readOnly={false} data={data} mode='json' onChange={e => updateJsonData(e.target.value)}/>
      {/*<CodeHighlight data={demoData} style={style} mode='json'/>*/}
    </div>
    <div className={`${currentPrefix}-preview-data`}>
      <div className={`${currentPrefix}-preview-center`}>
        <span className={`${currentPrefix}-preview-center-title`}>
          <span>
            <FormatMessage id='database.preview.templateEdit'/>
          </span>
          <a onClick={openDotHelp}>
            <FormatMessage id='database.preview.dot'/>
          </a>
        </span>
        <CodeEditor value={templateData} width='auto' height='calc(50vh - 50px)' onChange={e => _updateTemplate(e.target.value)}/></div>
      <div className={`${currentPrefix}-preview-right`}>
        <span className={`${currentPrefix}-preview-right-title`}>
          <FormatMessage id='database.preview.result'/>
        </span>
        <CodeHighlight data={demoCode} style={{height: 'calc(50vh - 50px)'}} mode={mode}/></div>
    </div>
  </div>;
});
