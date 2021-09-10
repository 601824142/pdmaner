import React  from 'react';
import { Select, FormatMessage } from 'components';
import {getPrefix} from '../../../lib/prefixUtil';
import _ from 'lodash/object';

export default React.memo(({prefix, dataChange, config}) => {
  const autoBackup = _.get(config, 'autoBackup', 3);
  const Option = Select.Option;
  const onChange = (e) => {
    console.log(parseInt(e.target.value));
    dataChange && dataChange(parseInt(e.target.value), 'autoBackup');
  };
  const currentPrefix = getPrefix(prefix);
  return <div className={`${currentPrefix}-setting-autoBackup`}>
    <div className={`${currentPrefix}-form-item`}>
      <span
        className={`${currentPrefix}-form-item-label`}
        title={FormatMessage.string({id: 'config.autoBackup.label'})}
      >
        <FormatMessage id='config.autoBackup.label'/>
      </span>
      <span className={`${currentPrefix}-form-item-component`}>
        <Select allowClear={false} notAllowEmpty defaultValue={autoBackup} onChange={onChange} >
          <Option
            key={0}
            value={'0'}
          >
            <FormatMessage id='config.autoBackup.0'/>
          </Option>
          <Option
            key={1}
            value={'1'}
          >
            <FormatMessage id='config.autoBackup.1'/>
          </Option>
          <Option
            key={2}
            value={'2'}
          >
            <FormatMessage id='config.autoBackup.2'/>
          </Option>
          <Option
            key={3}
            value={'3'}
          >
            <FormatMessage id='config.autoBackup.3'/>
          </Option>
          <Option
            key={4}
            value={'4'}
          >
            <FormatMessage id='config.autoBackup.4'/>
          </Option>
          <Option
            key={5}
            value={'5'}
          >
            <FormatMessage id='config.autoBackup.5'/>
          </Option>
        </Select>
      </span>
    </div>
  </div>
});
