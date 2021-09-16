import React, {useState, useMemo, useRef} from 'react';
import {DropButton, FormatMessage, IconTitle, Input, Checkbox} from 'components';
import {getPrefix} from '../../../lib/prefixUtil';
import {moveArrayPositionByArray} from '../../../lib/array_util';

export default React.memo(({ prefix, dataSource, dataChange }) => {
  const [data, setData] = useState(dataSource?.profile?.uiHint || []);
  const dataRef = useRef(data);
  dataRef.current = data;
  const [selected, setSelected] = useState([]);
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  const currentPrefix = getPrefix(prefix);
  const dropDownMenus = useMemo(() => ([
    {key: 5, name: FormatMessage.string({id: 'config.uiHint.addCount', data: {count: 5}})},
    {key: 10, name: FormatMessage.string({id: 'config.uiHint.addCount', data: {count: 10}})},
    {key: 15, name: FormatMessage.string({id: 'config.uiHint.addCount', data: {count: 15}})},
  ]),[]);
  const getSelectedFieldsIndex = () => {
    let tempData = [...(dataRef.current || [])];
    return tempData.map((d, index) => {
      if (selectedRef.current.includes(d.id)) {
        return index;
      }
      return null;
    }).filter(field => field !== null);
  };
  const addData = (add) => {
    let newData = [...dataRef.current];
    const selectedTrsIndex = getSelectedFieldsIndex();
    if (selectedTrsIndex.length > 0) {
      newData.splice(Math.min(...selectedTrsIndex), 0, ...add);
    } else {
      newData = newData.concat(add);
    }
    return newData;
  }
  const menuClick = (m) => {
    const count = m.key;
    const newData = [];
    for (let i = 0; i < count; i += 1) {
      newData.push({data: ['' , ''], id: Math.uuid()});
    }
    const tempData = addData(newData);
    setData(tempData);
    dataChange(tempData.filter(d => !!d.defKey), 'profile.uiHint');
  };
  const optUiHint = (type) => {
    let newData = [...data];
    switch (type) {
      case 'add':
        newData = addData([{defKey: '', defName: '', id: Math.uuid()}]);
        break;
      case 'delete':
        newData = newData.filter(p => !selected.includes(p.id));
      break;
      case 'up':
      case 'down':
        newData = moveArrayPositionByArray(newData, selected,
          type === 'up' ? -1 : 1, 'id')
        break;
    }
    setData(newData);
    dataChange(newData.filter(d => !!d.defKey), 'profile.uiHint');
  }
  const onSelect = (key, e) => {
    setSelected(pre => {
      if (!e.target.checked) {
        return pre.filter(k => k !== key);
      }
      return pre.concat(key);
    })
  };
  const onChange = (key, name, e) => {
    const newData = data.map(d => {
      if (d.id === key) {
        return {
          ...d,
          [name]: e.target.value,
        };
      }
      return d;
    });
    setData(newData);
    dataChange(newData.filter(d => !!d.defKey), 'profile.uiHint');
  }
  return <div className={`${currentPrefix}-setting-uiHint`}>
    <div>
      <div className={`${currentPrefix}-setting-uiHint-opt`}>
        <DropButton menuClick={menuClick} dropDownMenus={dropDownMenus} position='top'>
          <IconTitle title={FormatMessage.string({id: 'config.uiHint.add'})} onClick={() => optUiHint('add')} type='fa-plus'/>
        </DropButton>
        <IconTitle style={{opacity: selected.length === 0 ? 0.48 : 1}} disable={selected.length === 0} title={FormatMessage.string({id: 'config.uiHint.delete'})} onClick={() => optUiHint('delete')} type='fa-minus'/>
        <IconTitle disable={selected.length === 0} title={FormatMessage.string({id: 'config.uiHint.moveUp'})} onClick={() => optUiHint('up')} type='fa-arrow-up'/>
        <IconTitle disable={selected.length === 0} title={FormatMessage.string({id: 'config.uiHint.moveDown'})} onClick={() => optUiHint('down')} type='fa-arrow-down'/>
      </div>
      <div className={`${currentPrefix}-setting-uiHint-list`}>
        <table>
          <tbody>
            {
              data.map((d, i) => {
                return <tr key={d.id}>
                  <td>{i+1}</td>
                  <td><Checkbox onChange={e => onSelect(d.id, e)}/></td>
                  <td><Input placeholder={FormatMessage.string({id: 'config.uiHint.defKey'})} onChange={e => onChange(d.id, 'defKey', e)} defaultValue={d.defKey}/></td>
                  <td><Input placeholder={FormatMessage.string({id: 'config.uiHint.defName'})} onChange={e => onChange(d.id, 'defName', e)} defaultValue={d.defName}/></td>
                </tr>
              })
            }
          </tbody>
        </table>
      </div>
    </div>
  </div>;
});
