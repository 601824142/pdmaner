import React, {useState} from 'react';

import Tooltip from 'components/tooltip';
import DropDown from 'components/dropdown';
import Icon from '../icon';
import TabItem from './TabItem';
import { AutoCompose } from './AutoCompose';
import './style/index.less';
import {getPrefix} from '../../lib/prefixUtil';

const Header = React.memo(({
                             currentPrefix,
                             position,
                             tabChildren,
                             headerItemClick,
                             dropDownMenus,
                             menuClick,
                             activeKey,
                             closeTab,
                           }) => {
  const calcTitle = (c) => {
    if (position === 'left') {
      return <div className={`${currentPrefix}-tab-header-left-title`}>
        <span>{c.props.title}</span></div>;
    }
    return c.props.title;
  };
  return <div className={`${currentPrefix}-tab-header ${currentPrefix}-tab-header-${position}`}>
    {tabChildren.map(c =>
      <DropDown
        trigger='contextMenu'
        key={c.key}
        menus={dropDownMenus}
        menuClick={(...args) => menuClick(...args, c)}
        >
        <span
          onClick={() => headerItemClick(c.key)}
          className={`${currentPrefix}-tab-header-item ${currentPrefix}-tab-header-item-${activeKey === c.key ? 'show' : 'hidden'}`}
          >
          <span className={`${currentPrefix}-tab-header-item-icon-container`}>
            <Icon
              type={c.props?.icon}
              className={`${currentPrefix}-tab-header-item-icon ${currentPrefix}-tab-header-item-icon-${position}`}
              />
          </span>
          <Icon
            onClick={e => closeTab(e, c.key)}
            type='fa-times-circle'
            className={`${currentPrefix}-tab-header-item-close`}
            />
          <Tooltip
            placement='top'
            mouseEnterDelay={0.3}
            className={`${currentPrefix}-tab-header-item-tooltip`}
            key={c.key}
            title={c.props.tooltip}
            visible={position === 'top'}
          >
            <span>{calcTitle(c)}</span>
          </Tooltip>
        </span>
      </DropDown>)}
  </div>;
});

const Tab = React.memo((
  {prefix, defaultActiveKey, onChange, closeTab, excess, dropDownMenus, menuClick, empty,
    children = [], position, forwardRef, ...restProps}) => {
  const [activeKey, updateActiveKey] = useState();
  const _headerItemClick = (key) => {
    updateActiveKey(key);
    onChange && onChange(key);
  };
  const _closeTab = (e, key) => {
    e.stopPropagation();
    closeTab && closeTab(key);
  };
  const currentPrefix = getPrefix(prefix);
  const key = ('activeKey' in restProps ? restProps?.activeKey : activeKey) || children[0]?.key;
  return (
    <div className={`${currentPrefix}-tab ${currentPrefix}-tab-${position}`} ref={forwardRef}>
      {
        children.length > 0 ? <>
          {
            position === 'top' ? <div className={`${currentPrefix}-tab-header-container`}>
              <Header
                currentPrefix={currentPrefix}
                position={position}
                tabChildren={children}
                closeTab={_closeTab}
                headerItemClick={_headerItemClick}
                dropDownMenus={dropDownMenus}
                menuClick={menuClick}
                activeKey={key}
              />
            </div> : <Header
              currentPrefix={currentPrefix}
              position={position}
              tabChildren={children}
              closeTab={_closeTab}
              headerItemClick={_headerItemClick}
              dropDownMenus={dropDownMenus}
              menuClick={menuClick}
              activeKey={key}
            />
          }
          <div className={`${prefix}-tab-content`}>
            {children.map(c => React.cloneElement(c, {activeKey: key, currentKey: c.key}))}
            {excess}
          </div>
        </> : <>{empty}<div style={{display: 'none'}}>{excess}</div></>
      }
    </div>
  );
});

Tab.TabItem = TabItem;
Tab.defaultProps = {
  position: 'left',
  defaultActiveKey: '',
};

export default AutoCompose(Tab);
