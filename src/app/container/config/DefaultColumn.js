import React, {useState, useRef} from 'react';
import { FormatMessage, IconTitle} from 'components';
import { moveArrayPosition } from '../../../lib/array_util';
import {getPrefix} from '../../../lib/prefixUtil';
import {getFullColumns} from '../../../lib/datasource_util';


export default React.memo(({prefix, dataSource, columnsChange, className}) => {
    const [data, updateData] = useState(() => {
        const full = getFullColumns();
        return (dataSource?.profile?.headers || []).map(h => {
            return {
                ...h,
                value: full.filter(f => f.newCode === h.refKey)[0]?.value || h.refKey
            }
        })
    });
    const [selected, updateSelected] = useState('');
    const dataRef = useRef(data);
    dataRef.current = data;
    const selectedRef = useRef(selected);
    selectedRef.current = selected;
    const rowSelected = (p) => {
        if (selected === p) {
            updateSelected('');
        } else {
            updateSelected(p);
        }
    };
    const propsChange = (newData) => {
        columnsChange && columnsChange(newData);
    };
    const optProperty = (type) => {
        const optIndex = data.findIndex(d => d.refKey === selected);
        if (type === 'up' || type === 'down') {
            const tempData = moveArrayPosition(data, optIndex, type === 'up' ? optIndex - 1 : optIndex + 1);
            updateData(tempData);
            propsChange(tempData);
        }
    };
    const currentPrefix = getPrefix(prefix);
    return <div className={`${currentPrefix}-entity-base-properties ${className}`}>
        <div className={`${currentPrefix}-entity-base-properties-list-opt`}>
           <IconTitle disable={!selected} title={FormatMessage.string({id: 'tableEdit.moveUp'})} onClick={() => optProperty('up')} type='fa-arrow-up'/>
            <IconTitle disable={!selected} title={FormatMessage.string({id: 'tableEdit.moveDown'})} onClick={() => optProperty('down')} type='fa-arrow-down'/>
        </div>
        <div className={`${currentPrefix}-entity-base-properties-list-container`}>
            {data.map((p, index) => {
                return (
                    <div key={p.refKey}>
                        <div
                            onClick={() => rowSelected(p.refKey)}
                            className={`${currentPrefix}-entity-base-properties-list ${selected === p.refKey ? `${currentPrefix}-entity-base-properties-list-selected` : ''}`}
                        >
                            <span>{index + 1}</span>
                            <span
                                className={`${currentPrefix}-entity-base-properties-list-item`}
                            >
                <span>{p.value}</span>
              </span>
                        </div>
                        <div className={`${currentPrefix}-entity-base-properties-list-border`}>{}</div>
                    </div>
                );
            })}
        </div>
    </div>;
});
