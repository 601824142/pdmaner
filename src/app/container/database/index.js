import React, { useState } from 'react';
import {
  SimpleTab,
  FormatMessage,
  Input,
  Checkbox,
} from 'components';
import _ from 'lodash/object';

//import DefaultTemplate from './DefaultTemplate';
import CodeEditorContent from './CodeEditorContent';
import './style/index.less';
import { defaultTemplate } from '../../../lib/datasource_util';
import {getPrefix} from '../../../lib/prefixUtil';


export default React.memo(({prefix, data = {}, dataChange, dataSource}) => {
  const dataTypeSupport = dataSource?.profile?.dataTypeSupports?.
  filter(d => d.id === data.applyFor)[0]?.defKey;
  const getCodeTemplate = (type) => {
    const current = type || 'dbDDL';
    if (current === 'dbDDL') {
      return defaultTemplate[`${current}Template`];
    }
    return defaultTemplate.appCodeTemplate.concat(
        Object.keys(_.omit(data, [...defaultTemplate.dbDDLTemplate.concat(defaultTemplate.versionTemplate), 'applyFor', 'defKey', 'defaultDb', 'group', 'type', 'content'])));
  };
  const [allTemplate, setAllTemplate] = useState(() => {
    return getCodeTemplate(data.type);
  });
  const onChange = (e, type) => {
    const value = type === 'defaultDb' ? e.target.checked : e.target.value;
    switch (type) {
      case 'defaultDb':
        dataChange && dataChange(value, type);
        break;
      case 'type':
        setAllTemplate(getCodeTemplate(value));
        dataChange && dataChange(value, 'type');
        break;
      default: dataChange && dataChange(value, type);break;
    }
  };
  const currentPrefix = getPrefix(prefix);
  return <div className={`${currentPrefix}-database-container`}>
    <div className={`${currentPrefix}-form-item`}>
      <span
        className={`${currentPrefix}-form-item-label`}
        title={FormatMessage.string({id: 'database.defKey'})}
      >
        <span className={`${currentPrefix}-form-item-label-require`}>{}</span>
        <span>
          <FormatMessage id='database.defKey'/>
        </span>
      </span>
      <span className={`${currentPrefix}-form-item-component`}>
        <Input
          onChange={e => onChange(e, 'defKey')}
          defaultValue={dataTypeSupport || ''}
        />
      </span>
    </div>
    {
      !allTemplate?.includes('content') && <div className={`${currentPrefix}-form-item`}>
        <span
          className={`${currentPrefix}-form-item-label`}
          title={FormatMessage.string({id: 'database.defaultDb'})}
      >
          <span>
            <FormatMessage id='database.defaultDb'/>
          </span>
        </span>
        <span className={`${currentPrefix}-form-item-component`}>
          <Checkbox
            defaultChecked={data.defaultDb}
            onChange={e => onChange(e, 'defaultDb')}
        >
            <span
              className={`${currentPrefix}-database-container-defaultdb-message`}
          >
              <FormatMessage id='database.defaultDbMessage'/>
            </span>
          </Checkbox>
        </span>
      </div>
    }
    <div className={`${currentPrefix}-form-item`}>
      <span
        className={`${currentPrefix}-form-item-label`}
        title={FormatMessage.string({id: 'database.defaultTemplate'})}
        >
        <span>
          <FormatMessage id='database.defaultTemplate'/>
        </span>
      </span>
      <span className={`${currentPrefix}-form-item-component`}>
        <Checkbox
          disable
          defaultChecked={data.isDefault}
        />
      </span>
    </div>
    <div className={`${currentPrefix}-form-item`}>
      <span
        className={`${currentPrefix}-form-item-label`}
        title={FormatMessage.string({id: 'database.templateEdit'})}
      >
        <span>
          <FormatMessage id='database.templateEdit'/>
        </span>
      </span>
      <span className={`${currentPrefix}-form-item-component`}>
        <SimpleTab
          options={['normal', 'version'].filter((t) => {
            if (t === 'version') {
              return !allTemplate.includes('content');
            }
            return true;
          })
                .map(t => ({
                  key: t,
                  title: FormatMessage.string({id: `tableTemplate.${t}`}) || t,
                  content: <SimpleTab
                    className={`${currentPrefix}-database-container-tab`}
                    options={(t === 'normal' ? allTemplate : defaultTemplate.versionTemplate).map(d => ({
                            key: d,
                            title: FormatMessage.string({id: `tableTemplate.${d}`}) || d,
                            content: <CodeEditorContent
                              dataSource={dataSource}
                              prefix={currentPrefix}
                              value={data[d]}
                              width='auto'
                              height='40vh'
                              onChange={e => onChange(e, d)}
                              templateType={data.type}
                              dataTypeSupport={data.applyFor}
                              templateShow={d}
                            />,
                          }))}
                  />,
                }))}
        />
      </span>
    </div>
  </div>;
});
