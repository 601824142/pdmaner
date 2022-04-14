import React, { useState, useEffect, useRef } from 'react';

import SimpleTabContent from './SimpleTabContent';
import Icon from '../icon';

import './style/index.less';
import {getPrefix} from '../../lib/prefixUtil';
// 结构简单的TAB组件
export default React.memo(({ prefix, options = [], customerTitle, customerFooter,
                             onDelete, disableEdit, onAdd, draggable, onPositionChange,
                             offsetHeight, tabActiveChange, type = 'top', className = '', edit,
                             onTabDoubleClick }) => {
  const [stateOptions, setStateOptions] = useState(options);
  const tabStack = useRef([]);
  const [over, setOver] = useState(null);
  const dragData = useRef(null);
  const [active, updateActive] = useState(() => {
    const defaultKey = options[0]?.key || options[0]?.title;
    tabActiveChange && tabActiveChange(defaultKey);
    tabStack.current = [defaultKey];
    return defaultKey;
  });
  useEffect(() => {
    setStateOptions(options);
    tabStack.current = tabStack.current.filter(k => options.findIndex(o => o.key === k) > -1);
    updateActive(tabStack.current.length > 0 ? tabStack.current[tabStack.current.length - 1]
        : options[0]?.key);
  }, [options]);
  const deleteFuc = (e, key) => {
    e.stopPropagation();
    onDelete && onDelete(key, () => {
      tabStack.current.splice(tabStack.current.length - 1, 1);
      updateActive(pre => (pre === key ? tabStack.current[tabStack.current.length - 1] : pre));
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
  const _onTabDoubleClick = (key) => {
    onTabDoubleClick && onTabDoubleClick(key, (newKey) => {
      updateActive(newKey);
      tabStack.current[tabStack.current.length - 1] = newKey;
    });
  };
  const currentPrefix = getPrefix(prefix);
  const onDragOver = (e, o) => {
    if (dragData.current) {
      setOver(o.key || o.title);
    }
    e.preventDefault();
    e.stopPropagation();
  };
  const onDragStart = (o) => {
    dragData.current = o;
  };
  const onDragEnd = () => {
    if (dragData.current) {
      onPositionChange && onPositionChange(dragData.current, over);
    }
    dragData.current = null;
    setOver(null);
  };
  return <div className={`${currentPrefix}-simple-tab ${currentPrefix}-simple-tab-${type} ${className}`}>
    <div style={{height: offsetHeight ? `calc(100% - ${offsetHeight}px` : 'auto'}} className={`${currentPrefix}-simple-tab-titles ${currentPrefix}-simple-tab-titles-${type}`}>
      {customerTitle}
      {
        stateOptions.map(o => (
          <span
            onDragEnd={onDragEnd}
            onDragStart={() => onDragStart(o)}
            onDragOver={e => onDragOver(e, o)}
            draggable={draggable}
            style={{
              userSelect: onTabDoubleClick ? 'none' : 'auto',
              borderRight: over === (o.key || o.title) ? '1px dashed #4e75fd' : 'none',
            }}
            onDoubleClick={() => _onTabDoubleClick(o.key || o.title)}
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
      {customerFooter}
      {
        edit && <span onClick={add} style={{minWidth: '60px', textAlign: 'center'}} className={`${currentPrefix}-simple-tab-titles-title-default`}>
          <Icon type='fa-plus'/>
        </span>
      }
    </div>
    <div style={{borderTop: stateOptions.length === 0 ? '1px solid #5A7EE3' : 'none'}} className={`${currentPrefix}-simple-tab-contents ${currentPrefix}-simple-tab-contents-${type}`}>
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
