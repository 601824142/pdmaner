import React from 'react';

import {Input, MultipleSelect, FormatMessage, Select} from 'components';
import {getPrefix} from '../../../lib/prefixUtil';

export default React.memo(({prefix, dataSource, dataChange, data}) => {
  const { relationType = 'field' } = (dataSource.profile || {});
  const Option = MultipleSelect.Option;
  const currentPrefix = getPrefix(prefix);
  return <div>
    <div className={`${currentPrefix}-form`}>
      <div className={`${currentPrefix}-form-item`}>
        <span
          className={`${currentPrefix}-form-item-label`}
          title={FormatMessage.string({id: 'relation.defKey'})}
        >
          <span className={`${currentPrefix}-form-item-label-require`}>{}</span>
          <span>
            <FormatMessage id='relation.defKey'/>
          </span>
        </span>
        <span className={`${currentPrefix}-form-item-component`}>
          <Input defaultValue={data?.defKey} onChange={e => dataChange(e.target.value, 'defKey')}/>
        </span>
      </div>
      <div className={`${currentPrefix}-form-item`}>
        <span
          className={`${currentPrefix}-form-item-label`}
          title={FormatMessage.string({id: 'relation.defName'})}
        >
          <FormatMessage id='relation.defName'/>
        </span>
        <span className={`${currentPrefix}-form-item-component`}>
          <Input defaultValue={data?.defName} onChange={e => dataChange(e.target.value, 'defName')}/>
        </span>
      </div>
      <div className={`${currentPrefix}-form-item`}>
        <span
          className={`${currentPrefix}-form-item-label`}
          title={FormatMessage.string({id: 'relation.relationType'})}
          >
          <FormatMessage id='relation.relationType'/>
        </span>
        <span className={`${currentPrefix}-form-item-component`}>
          <Select
            disable={data.defKey}
            allowClear={false}
            notAllowEmpty
            onChange={e => dataChange(e.target.value, 'relationType')}
            defaultValue={data.relationType || relationType || 'field'}
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
      <div className={`${currentPrefix}-form-item`}>
        <span
          className={`${currentPrefix}-form-item-label`}
          title={FormatMessage.string({id: 'tableBase.group'})}
        >
          <FormatMessage id='tableBase.group'/>
        </span>
        <span className={`${currentPrefix}-form-item-component`}>
          <MultipleSelect
            defaultCheckValues={data?.group}
            onChange={keys => dataChange(keys, 'group')}
          >
            {
              dataSource?.viewGroups?.map(v => (
                <Option key={v.id} value={v.id}>{`${v.defKey}(${v.defName || v.defKey})`}</Option>))
            }
          </MultipleSelect>
        </span>
      </div>
    </div>
  </div>;
});

