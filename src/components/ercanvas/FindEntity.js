import React, {useState, useEffect, useRef, useMemo, forwardRef, useImperativeHandle} from 'react';

import SearchInput from '../searchinput';
import FormatMessage from '../formatmessage';
import {addBodyClick, removeBodyClick} from '../../lib/listener';

export default React.memo(forwardRef(({prefix, getGraph, dataSource}, ref) => {
  const id = useMemo(() => Math.uuid(), []);
  const [cells, setCells] = useState([]);
  const [searchValue, setSearchValue] = useState('');
  const searchRef = useRef(null);
  const listRef = useRef(null);
  const str = `<span class=${prefix}-search-suggest-list-search>$&</span>`;
  useImperativeHandle(ref, () => {
    return {
      focus: () => {
        const input = searchRef.current.querySelector('input');
        input?.focus();
      },
    };
  }, []);
  useEffect(() => {
    addBodyClick(id, (e) => {
      if (!searchRef?.current?.contains(e.target) && !listRef?.current?.contains(e.target)) {
        setSearchValue('');
      }
    });
    return () => {
      removeBodyClick(id);
    };
  }, []);
  useEffect(() => {
    if (searchValue) {
      const reg = new RegExp((searchValue)?.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'ig');
      setCells((getGraph()?.toJSON({diff: true}).cells || [])
        .map((c) => {
          if (c.originKey) {
            const entity = (dataSource?.entities || []).filter(e => e.id === c.originKey)[0];
            if (entity) {
              const tempDisplayMode = entity.nameTemplate || '{defKey}[{defName}]';
              const finalName = tempDisplayMode.replace(/\{(\w+)\}/g, (match, word) => {
                return entity[word] || entity.defKey || '';
              });
              if (reg.test(finalName)) {
                return {
                  name: finalName.replace(reg, str),
                  value: c.id,
                };
              }
              return null;
            }
            return null;
          } else if (c.label) {
            const finalLabel = c.label?.replace(/[-\/\\^$*+?.()|[\]{}#]|<[^>]*>|\r|\r\n/g, '');
            if (reg.test(finalLabel)) {
              return {
                name: finalLabel?.replace(reg, str),
                value: c.id,
              };
            }
            return null;
          }
          return null;
        }).filter(c => !!c));
    } else {
      setCells([]);
    }
  }, [searchValue]);
  const onChange = (e) => {
    setSearchValue(e.target.value);
  };
  const jump = (i) => {
    const cell = getGraph().getCellById(i);
    getGraph()?.centerCell(cell);
  };
  return <div className={`${prefix}-er-find-entity`} ref={searchRef}>
    <SearchInput value={searchValue} placeholder={FormatMessage.string({id: 'canvas.node.find'})} onChange={onChange}/>
    {
      cells.length > 0 && <div className={`${prefix}-er-find-entity-list`} ref={listRef}>
        {
          cells.map((c) => {
            return <div
              onClick={() => jump(c.value)}
              key={c.value}
              /* eslint-disable-next-line react/no-danger */
              dangerouslySetInnerHTML={{__html: c.name}}
            />;
          })
        }
      </div>
    }
  </div>;
}));
