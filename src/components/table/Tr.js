import React from 'react';
import * as Component from 'components';
import Cell from 'components/table/Cell';

export default React.memo(({f, i, expand, onMouseOver, tempHeaders, calcPosition,
                             getClass, tableRowClick, disableDragRow, checkboxComponents,
                             onMouseDown, currentPrefix, onExpand, expands, entities,
                             updateTableDataByName, comBlur, cellRef, onKeyDown, freeze,
                             reading, getDataSource, updateDataSource, cellClick, setDict,
                             hiddenFields, selectedColumns, openDict, defaultGroups, dicts,
                             getFieldProps, domains, mapping, uiHint}) => {
  const otherStyle = freeze ? { position: 'sticky', left: 0, zIndex: 2 } : {};
  const needHideInGraph = tempHeaders.findIndex(h => h.refKey === 'hideInGraph') > -1;
  let type = 'fa-eye';
  if (f.hideInGraph) {
    type = 'fa-eye-slash';
  }
  const onChange = (event, e) => {
    event.stopPropagation();
    updateTableDataByName && updateTableDataByName(f, 'hideInGraph', e);
  };
  return [<tr
    data-key={f.id}
    onMouseOver={onMouseOver}
    key={f.id}
    className={getClass}
  >
    <td
      style={{userSelect: 'none', cursor: disableDragRow ? 'pointer' : 'move', ...otherStyle}}
      onClick={e => tableRowClick(e, f.id)}
      onMouseDown={onMouseDown}
    >
      <span>
        <span>
          {i + 1}
        </span>
        {
          needHideInGraph && <span style={{float: 'right',marginRight: 2}}>
            <Component.Icon
              type={type}
              onClick={e => onChange(e, {target: { value: !f.hideInGraph}})}
            />
          </span>
        }
      </span>
    </td>
    {expand && <td className={`${currentPrefix}-table-expand`} onClick={() => onExpand(f.id)}>
      <span>{Component.FormatMessage.string({id: !expands.includes(f.id) ? 'tableEdit.expand' : 'tableEdit.unExpand'})}</span>
      <Component.Icon
        type='fa-angle-right '
        style={{transform: expands.includes(f.id) ? 'rotate(90deg)' : 'rotate(0deg)'}}
      />
    </td>}
    {
      tempHeaders
          .filter(h => !hiddenFields.includes(h.refKey))
          .map((h, cI) => {
            const zIndex = tempHeaders.length - cI + 2;
            const style = (h?.freeze && freeze) ? {position: 'sticky', zIndex, ...calcPosition(h, cI)} : {};
            const className = selectedColumns.includes(h?.refKey) ? `${currentPrefix}-table-selected` : '';
            if (h?.com && typeof h?.com === 'function') {
              return <td key={h?.refKey} style={style}>
                {h?.com(f)}
              </td>;
            }
            return <td
              className={className}
              key={h?.refKey}
              style={style}
              onClick={() => cellClick(h?.refKey, f)}
            >
              <Cell
                domains={domains}
                mapping={mapping}
                getFieldProps={getFieldProps}
                openDict={openDict}
                updateDataSource={updateDataSource}
                getDataSource={getDataSource}
                currentPrefix={currentPrefix}
                onKeyDown={e => onKeyDown(e, f.id, h?.refKey)}
                cellRef={c => cellRef(c, f.id, h?.refKey)}
                reading={(h?.com === 'label') || reading} // 是否是只读
                checkboxComponents={checkboxComponents}
                f={{
                  ...f,
                  ...getFieldProps(f.domain),
                }}
                name={h?.refKey}
                onChange={e => updateTableDataByName(f, h?.refKey, e)}
                onBlur={e => comBlur && comBlur(f, h?.refKey, e)}
                remarkChange={(name, e) => updateTableDataByName(f, name, e)}
                defaultGroups={defaultGroups}
                dicts={dicts}
                uiHint={uiHint}
                setDict={setDict}
                entities={entities}
              />
            </td>;
          })
    }
  </tr>,
  expand && f.children && <tr
    style={{display: expands.includes(f.id) ? '' : 'none'}}
    key={`${f.id}_1`}
  >
    <td style={{cursor: 'auto'}} colSpan={tempHeaders.length + 2}>
      {f.children}
    </td>
  </tr>,
];
}, (pre, next) => {
  const simpleProps = ['f', 'i', 'expand', 'tempHeaders', 'getClass', 'entities',
    'selectedColumns', 'defaultGroups', 'getFieldProps', 'domains', 'mapping', 'dicts', 'uiHint'];
  const calcArray = (oldData, newData) => {
    return (oldData === newData)
        || (oldData.includes(pre.f.id) && newData.includes(next.f.id))
        || (!oldData.includes(pre.f.id) && !newData.includes(next.f.id));
  };
  return simpleProps.every(p => pre[p] === next[p])
      && calcArray(pre.expands, next.expands);
});

