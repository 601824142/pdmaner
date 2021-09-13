import React from 'react';
import {Select, FormatMessage} from 'components';
import {getPrefix} from '../../../lib/prefixUtil';

export default React.memo(({prefix, dataChange, dataSource}) => {
  const Option = Select.Option;
  const { relationType = 'field' } = (dataSource.profile || {});
  const onChange = (e) => {
    dataChange && dataChange(e.target.value, 'profile.relationType');
  };
  const currentPrefix = getPrefix(prefix);
  return <div className={`${currentPrefix}-setting-relationtype`}>
    <div className={`${currentPrefix}-form-item`}>
      <span
        className={`${currentPrefix}-form-item-label`}
        title={FormatMessage.string({id: 'config.relationType'})}
      >
        <FormatMessage id='config.relationType'/>
      </span>
      <span className={`${currentPrefix}-form-item-component`}>
        <Select
          allowClear={false}
          notAllowEmpty
          onChange={onChange}
          defaultValue={relationType || 'field'}
        >
          <Option key='entity' value='entity'>
            <FormatMessage id='relation.relationEntity'/>
          </Option>
          <Option key='field' value='field'>
            <FormatMessage id='relation.relationField'/>
          </Option>
        </Select>
      </span>
    </div>
  </div>
});
