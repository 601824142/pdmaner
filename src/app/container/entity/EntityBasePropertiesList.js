import React, {useState, useRef, useMemo} from 'react';
import {Input, FormatMessage, DropButton, IconTitle} from 'components';
import { moveArrayPosition } from '../../../lib/array_util';
import {getPrefix} from '../../../lib/prefixUtil';


export default React.memo(({prefix, properties, propertiesChange, className}) => {
  const [data, updateData] = useState(() => {
    return Object.keys(properties)
      .reduce((a, b) => a.concat({data: [b || '' , properties[b] || ''], __key: Math.uuid()}) , []);
  });
  const fieldsRef = useRef([]);
  fieldsRef.current = data;
  const inputRef = useRef([]);
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
    propertiesChange && propertiesChange(newData.reduce((a, b) => {
      const tempA = {...a};
      const name = b?.data[0] || '';
      if (name) {
        tempA[b?.data[0]] = b?.data[1] || '';
      }
      return tempA;
    }, {}));
  };
  const optProperty = (type) => {
    const optIndex = data.findIndex(d => d.__key === selected);
    if (type === 'delete' && selected) {
      if (optIndex === (data.length - 1)) {
        updateSelected(data[optIndex - 1]?.__key);
      } else {
        updateSelected(data[optIndex + 1]?.__key);
      }
      const tempData = data.filter(d => d.__key !== selected);
      updateData(tempData);
      propsChange(tempData);
    } else if (type === 'add') {
      let tempData = [...data];
      const newData = {data: ['' , ''], __key: Math.uuid()};
      if (selected) {
        tempData.splice(optIndex, 0, newData);
      } else {
        tempData = data.concat(newData);
      }
      updateData(tempData);
      propsChange(tempData);
    } else if (type === 'up' || type === 'down') {
      const tempData = moveArrayPosition(data, optIndex, type === 'up' ? optIndex - 1 : optIndex + 1);
      updateData(tempData);
      propsChange(tempData);
    }
  };
  const onChange = (e, key, index) => {
    const value = e.target.value;
    const tempData = data.map((d) => {
      if (d.__key === key) {
        return {
          ...d,
          data: (d.data || []).map((a, i) => {
            if (i === index) {
              return value;
            }
            return a;
          }),
        };
      }
      return d;
    });
    updateData(tempData);
    propsChange(tempData);
  };
  const currentPrefix = getPrefix(prefix);
  const dropDownMenus = useMemo(() => ([
    {key: 5, name: FormatMessage.string({id: 'tableBase.addPropertyCount', data: {count: 5}})},
    {key: 10, name: FormatMessage.string({id: 'tableBase.addPropertyCount', data: {count: 10}})},
    {key: 15, name: FormatMessage.string({id: 'tableBase.addPropertyCount', data: {count: 15}})},
  ]),[]);
  const menuClick = (m) => {
    const count = m.key;
    let tempData = [...dataRef.current];
    const newData = [];
    for (let i = 0; i < count; i += 1) {
      newData.push({data: ['' , ''], __key: Math.uuid()});
    }
    if (selectedRef.current) {
      const optIndex = dataRef.current.findIndex(d => d.__key === selectedRef.current);
      tempData.splice(optIndex + 1, 0, ...newData);
    } else {
      tempData = dataRef.current.concat(newData);
    }
    updateData(tempData);
    propsChange(tempData);
  };
  const cellRef = (ref, row, cell) => {
    if(!inputRef.current[row]) {
      inputRef.current[row] = {};
    }
    inputRef.current[row][cell] = ref;
  };
  const getRowAndCellIndex = (row, cell, type) => {
    const headers = [{refKey: 'key'}, {refKey: 'value'}];
    let currentRowIndex, currentCellIndex;
    if (type === 'up') {
      currentRowIndex = fieldsRef.current.findIndex(f => f.__key === row);
      return {
        rowKey: fieldsRef.current[currentRowIndex - 1]?.__key,
        cellKey: cell,
      };
    } else if (type === 'down') {
      currentRowIndex = fieldsRef.current.findIndex(f => f.__key === row);
      return {
        rowKey: fieldsRef.current[currentRowIndex + 1]?.__key,
        cellKey: cell,
      };
    } else if (type === 'left') {
      currentCellIndex = headers.findIndex(f => f.refKey === cell);
      return {
        rowKey: row,
        cellKey: headers[currentCellIndex - 1]?.refKey,
      };
    }
    currentCellIndex = headers.findIndex(f => f.refKey === cell);
    return {
      rowKey: row,
      cellKey: headers[currentCellIndex + 1]?.refKey,
    };
  };
  const onKeyDown = (e, row, cell) => {
    if (e.keyCode === 38) {
      // up
      const { rowKey, cellKey } = getRowAndCellIndex(row, cell, 'up');
      const cellDom = inputRef.current?.[rowKey]?.[cellKey];
      if (cellDom) {
        cellDom.focus();
        cellDom.setSelectionRange(0, 0);
        e.preventDefault();
      }
    } else if (e.keyCode === 40) {
      // down
      const { rowKey, cellKey } = getRowAndCellIndex(row, cell, 'down');
      const cellDom = inputRef.current?.[rowKey]?.[cellKey];
      if (cellDom) {
        cellDom.focus();
        cellDom.setSelectionRange(0, 0);
        e.preventDefault();
      }
    } else if(e.keyCode === 37) {
      const selectionStart = e.target.selectionStart;
      if (selectionStart === 0) {
        const { rowKey, cellKey } = getRowAndCellIndex(row, cell, 'left');
        const cellDom = inputRef.current?.[rowKey]?.[cellKey];
        if (cellDom) {
          const length = cellDom.value.length;
          cellDom.focus();
          cellDom.setSelectionRange(length, length);
          e.preventDefault();
        }
      }
      // left
    } else if (e.keyCode === 39) {
      // right
      const valueLength = e.target.value.length;
      //console.log(e.target.selectionStart);
      const selectionStart = e.target.selectionStart;
      if (selectionStart === valueLength) {
        const { rowKey, cellKey } = getRowAndCellIndex(row, cell, 'right');
        const cellDom = inputRef.current?.[rowKey]?.[cellKey];
        if (cellDom) {
          cellDom.focus();
          cellDom.setSelectionRange(0, 0);
          e.preventDefault();
        }
      }
    }
  };
  return <div className={`${currentPrefix}-entity-base-properties ${className}`}>
    <div className={`${currentPrefix}-entity-base-properties-list-opt`}>
      <DropButton menuClick={menuClick} dropDownMenus={dropDownMenus} position='top'>
        <IconTitle title={FormatMessage.string({id: 'tableEdit.addField'})} onClick={() => optProperty('add')} type='fa-plus'/>
      </DropButton>
      <IconTitle style={{opacity: !selected ? 0.48 : 1}} disable={!selected} title={FormatMessage.string({id: 'tableEdit.deleteField'})} onClick={() => optProperty('delete')} type='fa-minus'/>
      <IconTitle disable={!selected} title={FormatMessage.string({id: 'tableEdit.moveUp'})} onClick={() => optProperty('up')} type='fa-arrow-up'/>
      <IconTitle disable={!selected} title={FormatMessage.string({id: 'tableEdit.moveDown'})} onClick={() => optProperty('down')} type='fa-arrow-down'/>
    </div>
    <div className={`${currentPrefix}-entity-base-properties-list-container`}>
      <table>
        <thead>
          <tr>
            <th>{}</th>
            <th>
              <span>
                <FormatMessage id='tableBase.propertyName'/>
              </span>
            </th>
            <th>
              <span>
                <FormatMessage id='tableBase.propertyValue'/>
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((p, index) => {
          return (
            <tr
              key={p.__key}
              onClick={() => rowSelected(p.__key)}
              className={`${selected === p.__key ? `${currentPrefix}-entity-base-properties-list-selected` : ''}`}
              >
              <td>{index + 1}</td>
              <td>
                <Input
                  onKeyDown={e => onKeyDown(e, p.__key, 'key')}
                  ref={ref => cellRef(ref, p.__key, 'key')}
                  value={p.data[0]}
                  onChange={e => onChange(e, p.__key, 0)}
                />
              </td>
              <td>
                <Input
                  onKeyDown={e => onKeyDown(e, p.__key, 'value')}
                  ref={ref => cellRef(ref, p.__key, 'value')}
                  value={p.data[1]}
                  onChange={e => onChange(e, p.__key, 1)}
                />
              </td>
            </tr>
          );
        })}
        </tbody>
      </table>
    </div>
  </div>;
});
