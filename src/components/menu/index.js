import React, {useState, useRef, useImperativeHandle, forwardRef, useEffect} from 'react';
import _ from 'lodash/object';

import ContextMenu from 'components/contextmenu';
import Icon from '../icon';
import './style/index.less';
import {getPrefix} from '../../lib/prefixUtil';
import { moveArrayPosition } from '../../lib/array_util';
import { allType } from '../../lib/datasource_util';
import {separator} from '../../../profile';
import {firstUp} from '../../lib/string';

const Menu = React.memo(forwardRef(({contextMenus = [], onContextMenu, fieldNames,
                           contextMenuClick, prefix, menus = [], doubleMenuClick, getName,
                           emptyData, defaultExpands, dragTable, groupType,
                           update, dataSource, sortEnable = true, draggable}, ref) => {
  const currentPrefix = getPrefix(prefix);
  const itemBase = `${currentPrefix}-menu-container-fold-item-child-`;
  const { icon, defName, defKey, children } = fieldNames;
  const [expandMenu, updateExpandMenu] = useState(defaultExpands || []);
  const [menusData, updateMenusData] = useState(menus);
  const [insert, updateInsert] = useState(menus);
  const menusDataRef = useRef([]);
  menusDataRef.current = menusData;
  const [position, updatePosition] = useState({top: 0, left: 0});
  const [selectedMenu, updateSelectedMenu] = useState([]);
  const startRef = useRef({index: -1});
  if ((menusData !== menus) && (menusData.length !== 0 && menus.length !== 0)){
    updateMenusData(menus);
  }
  const calcShiftSelected = (item, menu) => {
    let selected = [...selectedMenu];
    if (selected.length === 0) {
      return [item];
    }
    const minIndex = Math.min(...selectedMenu.map(m => menu.children.findIndex((c) => {
      return c.defKey === m.key;
    })));
    const currentIndex = menu.children.findIndex((c) => {
      return item.key === c.defKey;
    });
    if (minIndex >= 0) {
     selected = menu.children.map((m, i) => {
       if ((i >= currentIndex && i <= minIndex) || (i >= minIndex && i <= currentIndex)) {
         return {
           ...item,
           key: m.defKey,
         };
       }
       return null;
     }).filter(m => !!m);
    }
    return selected;
  };
  const onMenuClick = (e, key, type, parentKey, cb, menu) => {
    let tempSelectedMenu = [...selectedMenu];
    if (e.ctrlKey || e.metaKey) {
      if (tempSelectedMenu.some(s => s.key === key)) {
        tempSelectedMenu = tempSelectedMenu.filter(s => s.key !== key);
      } else {
        tempSelectedMenu.push({key, type, parentKey});
      }
    } else if(e.shiftKey) {
      // 自动选择连续
      tempSelectedMenu = calcShiftSelected({key, type, parentKey}, menu);
    } else {
      tempSelectedMenu = tempSelectedMenu.some(s => s.key === key) ? [] : [{key, type, parentKey}];
    }
    cb && cb(tempSelectedMenu);
    updateSelectedMenu(tempSelectedMenu);
  };
  const onDoubleMenuClick = (e, key, type, parentKey, menuIcon) => {
    onMenuClick(e, key, type, parentKey);
    doubleMenuClick && doubleMenuClick(key, type, parentKey, menuIcon);
  };
  const _expandMenuClick = (e, id, type, parentKey) => {
    if (expandMenu.includes(id)) {
      updateExpandMenu(expandMenu.filter(i => i !== id));
    } else {
      updateExpandMenu(expandMenu.concat(id));
    }
    onMenuClick(e, id, type, parentKey);
  };
  const _onContextMenu = (e, key, type, parentKey) => {
    e.stopPropagation();
    if (!selectedMenu.some(s => s.key === key)){
      onMenuClick(e, key, type, parentKey,(data) => {
        onContextMenu && onContextMenu(key, type, data, parentKey);
      });
    } else {
      onContextMenu && onContextMenu(key, type, selectedMenu, parentKey);
    }
    updatePosition({left: e.clientX, top: e.clientY});
  };
  const getClassName = (baseClass, key, childKey, type, offset) => {
    let tempClass = '';
    if (expandMenu.includes(key) || offset) {
      tempClass = `${baseClass}show`;
    } else {
      tempClass = `${baseClass}hidden`;
    }
    if (offset === undefined && selectedMenu.some(s => (s.key === childKey) && (s.type === type))) {
      tempClass += ` ${baseClass}selected`;
    }
    if (insert === childKey) {
      tempClass += ` ${baseClass}insert`;
    }
    return tempClass;
  };
  const tempDragTable = (e, child, key, i, parentKey) => {
    if (e.currentTarget.nodeName === 'SPAN') {
      startRef.current = {
        index: i,
        type: child.type,
        parentKey,
      };
      e.stopPropagation();
    } else if(child.type === 'entity'){
      e.preventDefault();
      dragTable && dragTable(e, key);
    } else {
      e.preventDefault();
    }
  };
  const rowOnDragOver = (e, key, pKey) => {
    if ((startRef.current.parentKey === pKey) && (key !== pKey)){
      updateInsert(key);
    }
    e.preventDefault();
    e.stopPropagation();
  };
  const rowOnDrop = (e, i, group, parentKey, menu) => {
    if ((startRef.current.parentKey === parentKey) &&
        (startRef.current.index > -1) && (startRef.current.index !== i)) {
      const name = allType.concat({ type: 'dataType', name: 'profile.dataTypeSupports', defKey: 'defKey' }).filter(t => t.type === startRef.current.type)[0];
      if (name) {
        if (group) {
          update && update({
            ...dataSource,
            viewGroups: (dataSource.viewGroups || []).map((g) => {
              if (g.id === group) {
                const refName = `ref${firstUp(name.name)}`;
                return {
                  ...g,
                  [refName]: moveArrayPosition(g[refName]
                          .filter(c => menu.children.findIndex(m => m.id === c) > -1),
                      startRef.current.index, i > startRef.current.index ? i : i + 1),
                };
              }
              return g;
            }),
          });
        } else {
          update && update({
            ..._.set(
                dataSource,
                name.name,
                moveArrayPosition(_.get(dataSource, name.name)
                        .filter(c => menu.children
                          .findIndex(m => m.id === c.id) > -1),
                    startRef.current.index, i > startRef.current.index ? i : i + 1),
            ),
          });
        }
      } else {
        update && update({
          ...dataSource,
          viewGroups: moveArrayPosition(dataSource.viewGroups || [],
            startRef.current.index, i > startRef.current.index ? i : i + 1),
        });
      }
    }
    startRef.current = { index: -1 };
    updateInsert('');
    e.preventDefault();
    e.stopPropagation();
  };
  const onContextMenuClick = (...args) => {
    contextMenuClick && contextMenuClick(...args, (type) => {
      updateExpandMenu((pre) => {
        return [...new Set(pre.concat(type))];
      });
    });
  };
  const getDraggable = (m) => {
    if (sortEnable) {
      return m.type === 'entity' ||
          m.type === 'view' ||
          m.type === 'dict' ||
          m.type === 'mapping' ||
          m.type === 'domain' ||
          m.type === 'diagram' ||
          m.type === 'groups' ||
          m.type === 'dataType';
    } else if (draggable){
      return m.type === 'entity';
    }
    return false;
  };
  useEffect(() => {
    //updateSelectedMenu([]);
  }, [groupType]);
  const getMenuItem = (parentMenu, menu = parentMenu, offsetNumber = 0, pI) => {
    const parentKey = menu === parentMenu ? null : parentMenu[defKey];
    const ulDraggable = getDraggable(menu);
    const pName = `${getName && getName(menu) || menu[defName]}${menu.type !== 'groups' ? `(${menu[children].length})` : ''}`;
    return (
      <ul
        className={getClassName(itemBase, parentMenu[defKey],
          menu[defKey],  menu[defKey], offsetNumber === 0)}
        key={menu[defKey]}
        onContextMenu={e => _onContextMenu(e, menu[defKey], menu.type, parentKey)}
        onDragOver={e => rowOnDragOver(e, menu[defKey], parentKey)}
        onDrop={e => rowOnDrop(e, pI, parentKey, parentKey, menu)}
      >
        <span
          title={pName}
          style={{paddingLeft: 8 * offsetNumber}}
          className={`${currentPrefix}-menu-container-fold-item
          ${selectedMenu.some(s => s.key === menu[defKey] && s.type === menu.type) ? ` ${currentPrefix}-menu-container-fold-item-selected` : ''}`}
          onClick={e => _expandMenuClick(e, menu[defKey], menu.type, parentKey)}
        >
          <span>
            <Icon type={menu[icon]} className={`${currentPrefix}-menu-container-fold-item-left`}/>
            <span
              className={`${currentPrefix}-menu-container-fold-item-name ${currentPrefix}-menu-container-fold-item-name-parent`}
          >
              {pName}
            </span>
          </span>
          <span className={`${currentPrefix}-menu-container-fold-item-right-group`}>
            <Icon
              style={{
                transform: `${expandMenu.includes(menu[defKey]) ? 'rotate(0deg)' : 'rotate(90deg)'}`,
              }}
              type='fa-angle-down'
              className={`${currentPrefix}-menu-container-fold-item-right`}
            />
            {
              ulDraggable && <span
                className={`${currentPrefix}-menu-container-fold-item-drag`}
                draggable
                onDragStart={e => tempDragTable(e, menu, menu[defKey], pI, parentKey)}
              >
                <div>
                  <span>{}</span>
                  <span>{}</span>
                  <span>{}</span>
                  <span>{}</span>
                  <span>{}</span>
                  <span>{}</span>
                </div>
              </span>
            }
          </span>
        </span>
        {
          (menu[children] || []).filter(child => !!child).map((child, i) => {
            const key = `${child[defKey]}`;
            if (child.children) {
              return getMenuItem(menu, child, offsetNumber + 1);
            }
            const draggableStatus = getDraggable(child);
            const name = getName && getName(child) || child[defName];
            return (<li
              title={name}
              key={`${child[defKey]}`}
              onContextMenu={e => _onContextMenu(e, key, child.type, parentKey)}
              onDoubleClick={e => onDoubleMenuClick(e, key, child.type, parentKey, menu.icon)}
              onClick={e => onMenuClick(e ,key, child.type, parentKey, null, menu)}
              className={getClassName(itemBase, menu[defKey], key, child.type)}
              onDragStart={e => tempDragTable(e, child, key, i, menu[defKey])}
              draggable={draggableStatus}
              onDragOver={e => rowOnDragOver(e, key, menu[defKey])}
              onDrop={e => rowOnDrop(e, i, parentKey, menu[defKey], menu)}
            >
              <span
                style={{paddingLeft: 8 * (offsetNumber + 1)}}
                className={`${currentPrefix}-menu-container-fold-item-name-child`}
              >
                {name}
              </span>
              {
                draggableStatus && <span
                  className={`${currentPrefix}-menu-container-fold-item-drag`}
                  draggable
                  onDragStart={e => tempDragTable(e, child, key, i, menu[defKey])}
                >
                  <div>
                    <span>{}</span>
                    <span>{}</span>
                    <span>{}</span>
                    <span>{}</span>
                    <span>{}</span>
                    <span>{}</span>
                  </div>
                </span>
              }
            </li>);
          })
        }
      </ul>
    );
  };
  const jumpPosition = (d, key) => {
    // 计算所有需要展开的父节点
    const group = d.groups[0]; // 多个分组存在的话取第一个分组
    let parent, parents;
    switch (key){
      case 'entities':
        parent = d.type === 'refViews' ? 'views' : 'entities';
        parents = group ? [group, `${group}${separator}${parent}`] : [parent];
        updateSelectedMenu([{
          key: d.id,
          parentKey: group,
          type: d.type === 'refViews' ? 'view' : 'entity',
        }]);
        updateExpandMenu(parents);break;
      case 'dicts':
        parent = 'dicts';
        parents = group ? [group, `${group}${separator}${parent}`] : [parent];
        updateSelectedMenu([{
          key: d.id,
          parentKey: group,
          type: 'dict',
        }]);
        updateExpandMenu(parents);break;
      default: break;
    }
  };
  const jumpDetail = (d, key) => {
    const positionData = {
      type: d.type,
      groups: d.groups,
    };
    switch (key){
      case 'entities':
        positionData.id = d.id;
        jumpPosition(positionData, key);break;
      case 'dicts':
        positionData.id = d.id;
        jumpPosition(positionData, key);break;
      case 'fields':
        positionData.id = d.entity;
        jumpPosition(positionData, 'entities');break;
      case 'dictItems':
        positionData.id = d.dict;
        jumpPosition(positionData, 'dicts');break;
      default: break;
    }
    const typeMap = {
      refEntities: {
        type: 'entity',
        icon: 'entity.svg',
      },
      refViews: {
        type: 'view',
        icon: 'view.svg',
      },
      refDicts: {
        type: 'dict',
        icon: 'dict.svg',
      },
    };
    const param = (key === 'fields' || key === 'dictItems') ? {defKey: d.id} : null;
    doubleMenuClick && doubleMenuClick(positionData.id,
        typeMap[d.type].type, d.groups[0], typeMap[d.type].icon, param);
  };
  useImperativeHandle(ref, () => {
    return {
      jumpPosition,
      jumpDetail,
      restSelected: () => updateSelectedMenu([]),
    };
  }, []);
  const _createGroup = (e) => {
    if (groupType === 'modalGroup') {
      onContextMenu && onContextMenu(null,
          'groups',
          { key: null, parentKey: null, type: 'groups' },
          null);
      updatePosition({left: e.clientX, top: e.clientY});
    }
  };
  const onMouseLeave = () => {
    updateInsert('');
  };
  return (
    <div
      onMouseLeave={onMouseLeave}
      className={`${currentPrefix}-menu-container-fold`}
      onContextMenu={_createGroup}
    >
      {
        menus.length === 0 ? emptyData : <ul>{menus
          .map((menu, i) => getMenuItem(menu, menu, 0, i))}</ul>
      }
      <ContextMenu menuClick={onContextMenuClick} menus={contextMenus} position={position}/>
    </div>
  );
}));

Menu.defaultProps = {
  fieldNames: {
    icon: 'icon',
    defKey: 'id',
    defName: 'defName',
    children: 'children',
  },
};

export default Menu;
