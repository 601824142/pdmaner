import React, { useState } from 'react';

import './style/index.less';
import {getPrefix} from '../../lib/prefixUtil';

const Input = React.memo(({rows = 3, cols = 20, prefix,
                            defaultValue, onChange, style, preventEnter,
                            ...restProps}) => {
  const [state, updateState] = useState(defaultValue);
  const _onChange = (e) => {
    updateState(e.target.value);
    onChange && onChange(e);
  };
  let tempValue = state;
  if ('value' in restProps) {
    tempValue = restProps?.value;
  }
  const currentPrefix = getPrefix(prefix);
  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      preventEnter && e.stopPropagation();
    }
  };
  return (<textarea onKeyDown={onKeyDown} className={`${currentPrefix}-textarea`} style={style} value={tempValue} rows={rows} cols={cols} onChange={_onChange}/>);
});

export default Input;
