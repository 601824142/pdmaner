import React, { useState } from 'react';
import {
  SimpleTab,
  FormatMessage,
  Input,
  Radio,
  Checkbox,
} from 'components';

//import DefaultTemplate from './DefaultTemplate';
import CodeEditorContent from './CodeEditorContent';
import './style/index.less';
import { defaultTemplate } from '../../../lib/datasource_util';
import {getPrefix} from '../../../lib/prefixUtil';

const RadioGroup = Radio.RadioGroup;

export default React.memo(({prefix, data = {}, dataChange, dataSource}) => {
  const dataTypeSupport = dataSource?.profile?.dataTypeSupports?.
  filter(d => d.id === data.applyFor)[0]?.defKey;
  const [allTemplate, setAllTemplate] = useState(() => {
    return defaultTemplate[`${data.type || 'dbDDL'}Template`];
  });
  const onChange = (e, type) => {
    const value = type === 'defaultDb' ? e.target.checked : e.target.value;
    switch (type) {
      case 'defaultDb':
        dataChange && dataChange(value, type);
        break;
      case 'type':
        setAllTemplate(defaultTemplate[`${value}Template`]);
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
    <div className={`${currentPrefix}-form-item`}>
      <span
        className={`${currentPrefix}-form-item-label`}
        title={FormatMessage.string({id: 'database.type'})}
      >
        <span>
          <FormatMessage id='database.type'/>
        </span>
      </span>
      <span className={`${currentPrefix}-form-item-component`}>
        <span>
          <RadioGroup
            name='type'
            onChange={e => onChange(e, 'type')}
            defaultValue={data.type || 'dbDDL'}
          >
            <Radio value='dbDDL'>
              <FormatMessage id='database.codeType.dbDDL'/>
            </Radio>
            <Radio value='appCode'>
              <FormatMessage id='database.codeType.appCode'/>
            </Radio>
          </RadioGroup>
        </span>
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
          options={allTemplate
               .map(d => ({
                 key: d,
                 title: FormatMessage.string({id: `tableTemplate.${d}`}) || d,
                 content: <CodeEditorContent
                   dataSource={dataSource}
                   prefix={currentPrefix}
                   value={data.type === 'appCode' ? data.content : data[d]}
                   width='auto'
                   height='40vh'
                   onChange={e => onChange(e, d)}
                   templateType={data.type}
                   dataTypeSupport={data.applyFor}
                   templateShow={d}
                 />,
               }))}
       />
      </span>
    </div>
  </div>;
});
