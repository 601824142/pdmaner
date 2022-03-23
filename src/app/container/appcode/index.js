import React from 'react';
import { Input, FormatMessage } from 'components';

import './style/index.less';
import {getPrefix} from '../../../lib/prefixUtil';

export default React.memo(({prefix, data, dataChange}) => {
    const onChange = (e, name) => {
        dataChange && dataChange(e.target.value, name);
    };
    const currentPrefix = getPrefix(prefix);
    return <div className={`${currentPrefix}-appcode ${currentPrefix}-form`}>
      <div className={`${currentPrefix}-form-item`}>
        <span
          className={`${currentPrefix}-form-item-label`}
          title={FormatMessage.string({id: 'appCodeData.defKey'})}
      >
          <span className={`${currentPrefix}-form-item-label-require`}>{}</span>
          <span>
            <FormatMessage id='appCodeData.defKey'/>
          </span>
        </span>
        <span className={`${currentPrefix}-form-item-component`}>
          <Input onChange={e => onChange(e, 'defKey')} defaultValue={data.defKey || ''}/>
        </span>
      </div>
    </div>;
});
