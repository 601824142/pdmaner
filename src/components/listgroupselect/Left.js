import React, { useState } from 'react';
import {Checkbox, FormatMessage, SearchInput} from 'components';

const Item = React.memo(({prefix, repeatData, checkBoxChange, checked, d, i, defaultSelected}) => {
  return <tr
    className={`${prefix}-listselect-left-item ${prefix}-listselect-left-item-${repeatData.includes(d.defKey) ? 'repeat' : 'normal'}`}
    key={d.id}
  >
    <td>{i + 1}</td>
    <td>
      <Checkbox
        disable={(defaultSelected || []).includes(d.id)}
        onChange={e => checkBoxChange(e, d.id)}
        checked={checked.includes(d.id)}
    >
        {`${d.defKey}[${d.defName || d.defKey}]`}{repeatData.includes(d.defKey) ? <div>[{FormatMessage.string({id: 'components.listSelect.repeatMessage'})}]</div> : ''}
      </Checkbox></td>
  </tr>;
}, (pre, next) => {
  return (pre.checked.includes(pre.d.id) && next.checked.includes(next.d.id)) ||
      (!pre.checked.includes(pre.d.id) && !next.checked.includes(next.d.id));
});

export default React.memo(({prefix, newData, checkBoxChange,
                             repeatData, checked, defaultSelected}) => {
  const [searchValue, setFilterValue] = useState('');
  const _onChange = (e) => {
    setFilterValue(e.target.value);
  };
  const reg = new RegExp((searchValue || '').replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
  return <div className={`${prefix}-listselect-left`}>
    <div className={`${prefix}-listselect-left-search`}>
      <SearchInput
        placeholder={FormatMessage.string({id: 'components.listSelect.search'})}
        onChange={_onChange}
      />
    </div>
    <div className={`${prefix}-listselect-left-container`}>
      <table>
        <tbody>
          {
          newData.filter(d => (!!d.defKey)
            && (reg.test(d.defKey || '') || reg.test(d.defName || ''))).map((d, i) => {
            return <Item
              defaultSelected={defaultSelected}
              i={i}
              prefix={prefix}
              key={`${d.id}${i}`}
              d={d}
              checkBoxChange={checkBoxChange}
              repeatData={repeatData}
              checked={checked}
            />;
          })
        }
        </tbody>
      </table>
    </div>
  </div>;
});
