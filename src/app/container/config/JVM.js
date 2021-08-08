import React, { useState } from 'react';
import {FormatMessage, Input} from 'components';
import { defaultJVM } from '../../../lib/datasource_util';

import {getPrefix} from '../../../lib/prefixUtil';

export default React.memo(({ prefix, dataChange, config }) => {
  const [value, updateValue] = useState( config?.jvm || defaultJVM);
  const onChange = (e) => {
    updateValue(e.target.value);
    dataChange && dataChange(e.target.value, 'jvm');
  };
  const currentPrefix = getPrefix(prefix);
  return <div className={`${currentPrefix}-setting-jvm`}>
    <div className={`${currentPrefix}-form-item`}>
      <span
        className={`${currentPrefix}-form-item-label`}
        title={FormatMessage.string({id: 'config.JVMLabel'})}
      >
        <FormatMessage id='config.JVMLabel'/>
      </span>
      <span className={`${currentPrefix}-form-item-component`}>
        <Input
          placeholder={FormatMessage.string({id: 'config.JVMPlaceholder'})}
          onChange={onChange}
          value={value}
        />
      </span>
    </div>
  </div>;
});
