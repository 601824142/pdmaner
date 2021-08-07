import React, { useState } from 'react';
import {FormatMessage, NumberInput} from 'components';

import {getPrefix} from '../../../lib/prefixUtil';

export default React.memo(({ prefix, dataChange, config }) => {
  const [value, updateValue] = useState( config?.jvmMemory || 8);
  const onChange = (e) => {
    updateValue(e.target.value);
    dataChange && dataChange(e.target.value, 'jvmMemory');
  };
  const currentPrefix = getPrefix(prefix);
  return <div className={`${currentPrefix}-setting-jvm`}>
    <div className={`${currentPrefix}-form-item`}>
      <span
        className={`${currentPrefix}-form-item-label`}
        title={FormatMessage.string({id: 'config.JVM_MemoryLabel'})}
      >
        <FormatMessage id='config.JVM_MemoryLabel'/>
      </span>
      <span className={`${currentPrefix}-form-item-component`}>
        <span className={`${currentPrefix}-setting-jvm-number`}>
          <NumberInput
            placeholder={FormatMessage.string({id: 'config.JVM_MemoryPlaceholder'})}
            onChange={onChange}
            value={value}
          />
        <span>G</span>
        </span>
      </span>
    </div>
  </div>;
});
