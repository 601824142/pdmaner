import React, {useState, useRef} from 'react';
import { FormatMessage, IconTitle, Icon} from 'components';
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
    const onClick = (p) => {
        updateData((pre) => {
            const temp = pre.map(d => {
                if (d.refKey === p.refKey) {
                    return {
                        ...d,
                        hideInGraph: !d.hideInGraph,
                    }
                }
                return d;
            })
            propsChange(temp);
            return temp;
        });
    }
    return <div className={`${currentPrefix}-entity-base-properties ${className}`}>
        <div className={`${currentPrefix}-entity-base-properties-list-opt`}>
           <IconTitle disable={!selected} title={FormatMessage.string({id: 'tableEdit.moveUp'})} onClick={() => optProperty('up')} type='fa-arrow-up'/>
            <IconTitle disable={!selected} title={FormatMessage.string({id: 'tableEdit.moveDown'})} onClick={() => optProperty('down')} type='fa-arrow-down'/>
        </div>
        <div className={`${currentPrefix}-entity-base-properties-list-container`}>
            <table>
                <thead>
                    <th/>
                    <th><FormatMessage id='config.columnName'/></th>
                    <th><FormatMessage id='config.hideInGraph'/></th>
                </thead>
                <tbody>
                {data.map((p, index) => {
                    return (
                        <tr key={p.refKey}
                            onClick={() => rowSelected(p.refKey)}
                            className={`${selected === p.refKey ? `${currentPrefix}-entity-base-properties-list-selected` : ''}`}
                        >
                                <td style={{width: '30px'}}>{index + 1}</td>
                                <td>{p.value}</td>
                                <td><Icon onClick={() => onClick(p)} style={{cursor: 'pointer'}} type={`fa-eye${p.hideInGraph ? '-slash' : ''}`}/>{p.hideInGraph}</td>
                        </tr>
                    );
                })}
                </tbody>
            </table>
        </div>
    </div>;
});
