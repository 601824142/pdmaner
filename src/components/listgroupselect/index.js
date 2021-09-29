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
            .filter(d => groups.findIndex(g => g.id === d.id) < 0)
            .map(g => ({...g, fields: []})));
  },[groups]);
  const newData = useMemo(() => data.reduce((a, b) => {
    return a.concat(b.fields.map(f => ({...f, group: b.id})));
  }, []), [data]);
  const currentData = arrayData || groups.reduce((a, b) => a.concat(b.fields), [groups]);
  const newDataKeys = useMemo(() => newData.map(n => n.id), [newData]);
  const repeatData = useMemo(() => currentData.map(f => f.defKey)
      .filter(f => newData.map(n => n.defKey).includes(f)), [data, groups]);
  const [checked, setChecked] = useState([...defaultSelected]);
  useEffect(() => {
    setChecked([...defaultSelected]);
  }, [newDataKeys]);
  const checkedRef = useRef(null);
  checkedRef.current = checked;
  const importDataRef = useRef([...newData]);
  importDataRef.current = [...newData];
  useImperativeHandle(ref, () => {
    return {
      getData: () => {
        const current = importDataRef.current.filter(f => checkedRef.current.includes(f.id));
        return currentGroup.map((g) => {
          const currentFields = current
              .filter(c => c.group === g.id)
              .map(c => _.omit(c, ['group']));
          return {
            ...g,
            fields: g.fields
                .filter(f => currentFields.findIndex(c => c.id === f.id) < 0)
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
        return [...new Set(importDataRef.current.map(d => d.id))];
      });
    }
  };
  const _onGroupChange = (e, id) => {
    const keys = [].concat(id);
    importDataRef.current = importDataRef.current.map((f) => {
      if (keys.includes(f.id)) {
        return {
          ...f,
          group: e.target.value,
        };
      }
      return f;
    });
  };
  const onRemove = (keys) => {
    setChecked((pre) => {
      return pre.filter(p => !keys.includes(p));
    });
  };
  const _checkBoxChange = (e, id) => {
    setChecked((pre) => {
      if (!e.target.checked) {
        return pre.filter(p => p !== id);
      }
      return pre.concat(id);
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
        newData={[...new Set(checked)].map((c) => {
          return newData.filter(d => d.id === c)[0];
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
