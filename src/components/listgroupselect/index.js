import React, {useState, useMemo, forwardRef, useImperativeHandle, useRef, useEffect} from 'react';
import _ from 'lodash/object';

import './style/index.less';
import {getPrefix} from '../../lib/prefixUtil';
import Left from './Left';
import Right from './Right';

export default React.memo(forwardRef(({allowClear = false, notAllowEmpty = true,
                                        data, groups, prefix, formatResult, arrayData,
                                        defaultSelected = []}, ref) => {
  const currentPrefix = getPrefix(prefix);
  const currentGroup = useMemo(() => {
    return groups
        .concat(data
            .filter(d => groups.findIndex(g => g.defKey === d.defKey) < 0)
            .map(g => ({...g, fields: []})));
  },[groups]);
  const newData = useMemo(() => data.reduce((a, b) => {
    return a.concat(b.fields.map(f => ({...f, group: b.defKey})));
  }, []), [data]);
  const currentData = arrayData || groups.reduce((a, b) => a.concat(b.fields), [groups]);
  const newDataKeys = useMemo(() => newData.map(n => n.defKey), [newData]);
  const repeatData = useMemo(() => currentData.map(f => f.defKey)
      .filter(f => newDataKeys.includes(f)), [data, groups]);
  const [checked, setChecked] = useState([...defaultSelected]);
  useEffect(() => {
    setChecked([...defaultSelected]);
  }, [newDataKeys]);
  const checkedRef = useRef(null);
  checkedRef.current = checked;
  const importDataRef = useRef([...newData]);
  useImperativeHandle(ref, () => {
    return {
      getData: () => {
        const current = importDataRef.current.filter(f => checkedRef.current.includes(f.defKey));
        return currentGroup.map((g) => {
          const currentFields = current
              .filter(c => c.group === g.defKey)
              .map(c => _.omit(c, ['group']));
          return {
            ...g,
            fields: g.fields
                .filter(f => currentFields.findIndex(c => c.defKey === f.defKey) < 0)
                .concat(currentFields),
          };
        });
      },
    };
  }, []);
  const _iconClick = (type) => {
    if (type === 'all') {
      setChecked([...defaultSelected || []]);
    } else {
      setChecked(() => {
        return [...new Set(importDataRef.current.map(d => d.defKey))];
      });
    }
  };
  const _onGroupChange = (e, defKey) => {
    importDataRef.current = importDataRef.current.map((f) => {
      if (f.defKey === defKey) {
        return {
          ...f,
          group: e.target.value,
        };
      }
      return f;
    });
  };
  const onRemove = (key) => {
    setChecked((pre) => {
      return pre.filter(p => p !== key);
    });
  };
  const _checkBoxChange = (e, defKey) => {
    setChecked((pre) => {
      if (!e.target.checked) {
        return pre.filter(p => p !== defKey);
      }
      return pre.concat(defKey);
    });
  };
  const calcType = () => {
    // normal all ind
    if (checked.length === newDataKeys.length) {
      return 'all';
    } else if (checked.length === 0) {
      return 'normal';
    }
    return 'ind';
  };
  const type = calcType();
  return <div className={`${currentPrefix}-listselect`}>
    <div className={`${currentPrefix}-listselect-opt`}>
      <span className={`${currentPrefix}-listselect-opt-${type}`} onClick={() => _iconClick(type)}>
        {}
      </span>
      <span>{formatResult && formatResult(newData, repeatData)}</span>
    </div>
    <div className={`${currentPrefix}-listselect-container`}>
      <Left
        defaultSelected={defaultSelected}
        prefix={currentPrefix}
        checked={checked}
        newData={newData}
        checkBoxChange={_checkBoxChange}
        repeatData={repeatData}
      />
      <Right
        defaultSelected={defaultSelected}
        currentGroup={currentGroup}
        newData={[...new Set(checked.reverse())].map((c) => {
          return newData.filter(d => d.defKey === c)[0];
        }).filter(d => !!d)}
        prefix={currentPrefix}
        onGroupChange={_onGroupChange}
        onRemove={onRemove}
        allowClear={allowClear}
        notAllowEmpty={notAllowEmpty}
      />
    </div>
  </div>;
}));
