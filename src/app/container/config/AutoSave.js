import React  from 'react';
import { Select, FormatMessage } from 'components';
import {getPrefix} from '../../../lib/prefixUtil';

export default React.memo(({prefix, dataChange, config}) => {
  const autoSave = config?.autoSave || 0;
  const Option = Select.Option;
  const onChange = (e) => {
    dataChange && dataChange(e.target.value, 'autoSave');
  };
  const currentPrefix = getPrefix(prefix);
  return <div className={`${currentPrefix}-setting-autoSave`}>
    <div className={`${currentPrefix}-form-item`}>
      <span
        className={`${currentPrefix}-form-item-label`}
        title={FormatMessage.string({id: 'config.autoSave.label'})}
      >
        <FormatMessage id='config.autoSave.label'/>
      </span>
      <span className={`${currentPrefix}-form-item-component`}>
        <Select allowClear={false} notAllowEmpty defaultValue={autoSave} onChange={onChange} >
          <Option
            key={0}
            value={0}
          >
            <FormatMessage id='config.autoSave.0'/>
          </Option>
          <Option
            key={2}
            value={2}
          >
            <FormatMessage id='config.autoSave.2'/>
          </Option>
          <Option
            key={5}
            value={5}
          >
            <FormatMessage id='config.autoSave.5'/>
          </Option>
          <Option
            key={10}
            value={10}
          >
            <FormatMessage id='config.autoSave.10'/>
          </Option>
          <Option
            key={20}
            value={20}
          >
            <FormatMessage id='config.autoSave.20'/>
          </Option>
          <Option
            key={30}
            value={30}
          >
            <FormatMessage id='config.autoSave.30'/>
          </Option>
          <Option
            key={60}
            value={60}
          >
            <FormatMessage id='config.autoSave.60'/>
          </Option>
        </Select>
      </span>
    </div>
  </div>
});
