import React, { useState, useRef, forwardRef } from 'react';
import './style/index.less';
import {getPrefix} from '../../lib/prefixUtil';
import ContextMenu from '../contextmenu';

export default React.memo(forwardRef(({data, prefix, draggable, contextMenuClick, contextMenus,
                                          emptyData, onDoubleClick, ...restProps}, ref) => {
    const currentPrefix = getPrefix(prefix);
    const [selected, setSelected] = useState([]);
    const [insert, setInsert] = useState('');
    const [position, setPosition] = useState({top: 0, left: 0});
    const dragCurrent = useRef(null);
    const onDragStart = (e, id) => {
        dragCurrent.current = id;
        e.stopPropagation();
    };
    const onDragOver = (e, id) => {
        setInsert(id);
        e.preventDefault();
        e.stopPropagation();
    };
    const onDrop = (dropId) => {
      restProps.onDrop?.(dropId, dragCurrent.current);
      setInsert('');
    };
    const dropEnd = () => {
        dragCurrent.current = '';
        setInsert('');
    };
    const onClick = (e, id) => {
        if (e.ctrlKey || e.metaKey) {
            setSelected(pre => (pre.includes(id) ? pre.filter(p => p !== id) : pre.concat(id)));
        } else {
            setSelected(pre => (pre.includes(id) ? [] : [id]));
        }
    };
    const onContextMenu = (e, d) => {
        let otherMenus = [];
        if (!selected.includes(d.id)) {
            setSelected(d.id);
            otherMenus = data.filter(item => item.id === d.id);
        } else {
            otherMenus = data.filter(item => selected.includes(item.id));
        }
        restProps.onContextMenu?.(d.id, d.type, otherMenus);
        e.stopPropagation();
        setPosition({left: e.clientX, top: e.clientY});
    };
    const doubleClick = (e, id) => {
        onClick(e, id);
        onDoubleClick && onDoubleClick(id);
    };
    return <div ref={ref} className={`${currentPrefix}-list`} onMouseLeave={dropEnd} onMouseUp={dropEnd}>
      {
            data.length === 0 ? emptyData : data.map((d) => {
                const className = selected.includes(d.id) ? 'active' : 'default';
                return <div
                  onContextMenu={e => onContextMenu(e, d)}
                  onDragOver={e => onDragOver(e, d.id)}
                  onDrop={() => onDrop(d.id)}
                  key={d.id}
                  onDoubleClick={e => doubleClick(e, d.id)}
                  onClick={e => onClick(e, d.id)}
                  className={`${currentPrefix}-list-item-${className} ${insert === d.id ? `${currentPrefix}-list-item-insert` : ''}`}
                >
                  <span>{d.defKey}</span>
                  {
                        draggable && <span
                          style={{width: '25px', padding: '5px 6px'}}
                          className={`${currentPrefix}-menu-container-fold-item-drag`}
                          draggable
                          onDragStart={e => onDragStart(e, d.id)}
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
                </div>;
            })
        }
      <ContextMenu menuClick={contextMenuClick} menus={contextMenus} position={position}/>
    </div>;
}));
