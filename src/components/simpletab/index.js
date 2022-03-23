import React, { useState, useEffect, useRef } from 'react';

import SimpleTabContent from './SimpleTabContent';
import Icon from '../icon';

import './style/index.less';
import {getPrefix} from '../../lib/prefixUtil';
// 结构简单的TAB组件
export default React.memo(({ prefix, options = [], onDelete, disableEdit, onAdd,
                             tabActiveChange, type = 'top', className = '', edit }) => {
  const [stateOptions, setStateOptions] = useState(options);
  const tabStack = useRef([]);
  useEffect(() => {
    setStateOptions(options);
  }, [options]);
  const [active, updateActive] = useState(() => {
    const defaultKey = options[0]?.key || options[0]?.title;
    tabActiveChange && tabActiveChange(defaultKey);
    tabStack.current = [defaultKey];
    return defaultKey;
  });
  const deleteFuc = (e, key) => {
    e.stopPropagation();
    onDelete && onDelete(key, () => {
      tabStack.current.splice(tabStack.current.length - 1, 1);
      updateActive(pre => (pre === key ? tabStack.current[tabStack.current.length - 1] : pre));
      setStateOptions(pre => pre.filter(p => (p.key || p.title) !== key));
    });
  };
  const add = () => {
    onAdd && onAdd((key) => {
      updateActive(key);
      tabStack.current.push(key);
    });
  };
  const _updateActive = (key) => {
    tabStack.current = tabStack.current.filter(t => t !== key).concat(key);
    updateActive(key);
    tabActiveChange && tabActiveChange(key);
  };
  const currentPrefix = getPrefix(prefix);
  return <div className={`${currentPrefix}-simple-tab ${currentPrefix}-simple-tab-${type} ${className}`}>
    <div className={`${currentPrefix}-simple-tab-titles ${currentPrefix}-simple-tab-titles-${type}`}>
      {
        stateOptions.map(o => (
          <span
            key={o.key || o.title}
            onClick={() => _updateActive(o.key || o.title)}
            className={`${currentPrefix}-simple-tab-titles-title-${active === (o.key || o.title) ? 'active' : 'default'}`}
          >
            {o.title}
            { edit && disableEdit !== o.key && <span onClick={e => deleteFuc(e, o.key || o.title)} className={`${currentPrefix}-simple-tab-close`}><Icon type='fa-times-circle'/></span>}
          </span>
          ),
        )
      }
      {
        edit && <span onClick={add} style={{minWidth: '60px', textAlign: 'center'}} className={`${currentPrefix}-simple-tab-titles-title-default`}>
          <Icon type='fa-plus'/>
        </span>
      }
    </div>
    <div className={`${currentPrefix}-simple-tab-contents ${currentPrefix}-simple-tab-contents-${type}`}>
      {
        stateOptions.map(o => (
          <div
            key={o.key || o.title}
            className={`${currentPrefix}-simple-tab-contents-content-${active === (o.key || o.title) ? 'active' : 'default'}`}
          >
            <SimpleTabContent
              content={o.content}
              tabId={o.key || o.title}
              activeId={active}
              forceUpdate={o.forceUpdate}
            />
          </div>
          ),
        )
      }
    </div>
  </div>;
});
