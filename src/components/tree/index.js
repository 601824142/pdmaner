import React, { useState, useMemo } from 'react';

import CheckBox from 'components/checkbox';
import Icon from 'components/icon';
import SearchInput from 'components/searchinput';

import './style/index.less';
import {getPrefix} from '../../lib/prefixUtil';
import {tree2array} from '../../lib/tree';

const Tree = React.memo(({prefix, dataSource, labelRender, defaultCheckeds,
                           onChange, placeholder}) => {
  const calcKey = (c) => {
    return c.reduce((a, b) => a.concat(b.key).concat(calcKey(b.children || [])), []);
  };
  const arrayData = useMemo(() => tree2array(dataSource), [dataSource]);
  const parentKeys = useMemo(() => arrayData.filter(d => !!d.children).map(d => d.key),
      [arrayData]);
  const [searchValue, updateSearchValue] = useState('');
  const checkedData = [...(defaultCheckeds || [])];
  const checkData = useMemo(() => arrayData.filter(d => checkedData.includes(d.key)), []);
  const [checkeds, updateCheckeds] = useState(() => {
    checkData.filter(d => !!d.children).forEach((d) => {
      // 先处理所有父节点 把父节点下的所有子节点选中
      checkedData.push(...calcKey(d.children));
    });
    checkData.filter(d => !d.children).forEach((d) => {
      // 处理所有的子节点
      d.parents.reverse().forEach((p) => {
        if (!checkedData.includes(p.key)) {
          if (calcKey(p.children || []).every(c => checkedData.includes(c))) {
            checkedData.push(p.key);
          }
        }
      });
    });
    return [...new Set(checkedData)];
  });
  const [expands, updateExpands] = useState(() => {
    return checkData.reduce((a, b) => a.concat(b.parents),[]).map(d => d.key);
  });
  const _iconClick = (key) => {
    let tempExpands = [...expands];
    if (tempExpands.includes(key)) {
      tempExpands = tempExpands.filter(k => k !== key);
    } else {
      tempExpands = tempExpands.concat(key);
    }
    updateExpands(tempExpands);
  };
  const _checkBoxChange = (e, { key, children }, parent) => {
    let tempCheckeds = [...checkeds];
    const checked = e.target.checked;
    if (checked) {
      const currentChecked = [key];
      if (parent && parent.children
          .filter(c => c.key !== key)
          .every(c => tempCheckeds.includes(c.key))) {
        // 判断是否需要选中父节点
        currentChecked.push(parent.key);
      }
      if (children) {
        // 选中所有子节点
        currentChecked.push(...calcKey(children));
      }
      tempCheckeds = [...new Set(tempCheckeds.concat(currentChecked))];
    } else {
      const currentUnChecked = [key];
      if (parent && tempCheckeds.includes(parent.key)) {
        // 判断是否需要取消选中父节点
        currentUnChecked.push(parent.key);
      }
      if (children) {
        // 取消选中所有子节点
        currentUnChecked.push(...calcKey(children));
      }
      tempCheckeds = tempCheckeds.filter(p => !currentUnChecked.includes(p));
    }
    updateCheckeds(tempCheckeds);
    onChange && onChange(tempCheckeds.filter(k => !parentKeys.includes(k)));
  };
  const currentPrefix = getPrefix(prefix);
  const reg = new RegExp((searchValue || '')
    .replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
  const renderChild = (d, p) => {
    return d.children ?
      <ul key={d.key}>
        <li className={`${currentPrefix}-tree-container-ul-parent-${expands.includes(d.key) ? 'show' : 'hidden'}`}>
          <Icon type='fa-caret-down' onClick={() => _iconClick(d.key)}/>
          <CheckBox
            checked={checkeds.includes(d.key)}
            onChange={e => _checkBoxChange(e, d, p)}
            >
            <span>{d.value}</span>
          </CheckBox></li>
        {
          d.children.length > 0 && <ul style={{marginLeft: 17}} className={`${currentPrefix}-tree-container-ul-child-${expands.includes(d.key) ? 'show' : 'hidden'}`}>
            {d.children.filter((c) => {
              return c.children || reg.test(c.value || '');
            }).map(c => renderChild(c, d))}
          </ul>
        }
      </ul> : <li key={d.key} style={{marginLeft: 8}}>
        <CheckBox
          checked={checkeds.includes(d.key)}
          onChange={e => _checkBoxChange(e, d, p)}
        >
          <span>{labelRender && labelRender(d.key, d.value) || d.value}</span>
        </CheckBox>
      </li>;
  };
  const onSearchChange = (e) => {
    updateSearchValue(e.target.value);
    const currentReg = new RegExp((e.target.value || '')
      .replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
    const searchData = e.target.value ? arrayData.filter(d => currentReg.test(d.value || '')) : [];
    updateExpands(pre => pre
      .concat([...new Set(searchData.reduce((a, b) => a.concat(b.parents.map(p => p.key)), []))]));
  };
  return (
    <ul className={`${currentPrefix}-tree`}>
      <ul className={`${currentPrefix}-tree-all`}>
        <li><SearchInput onChange={onSearchChange} placeholder={placeholder}/></li>
        <ul>
          {
            dataSource.map(d => renderChild(d))
          }
        </ul>
      </ul>
    </ul>
  );
});

export default Tree;
