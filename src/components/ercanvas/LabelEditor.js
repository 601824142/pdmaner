import React  from 'react';
import { Input } from 'components';

import './style/index.less';
import {getPrefix} from '../../lib/prefixUtil';

export default React.memo(({ prefix, label, labelChange }) => {
  const onChange = (e) => {
    labelChange && labelChange(e.target.value);
  };
  const currentPrefix = getPrefix(prefix);
  return <div className={`${currentPrefix}-label-editor`}>
    <Input defaultValue={label} onChange={onChange}/>
  </div>;
});
