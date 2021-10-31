import React, {useRef, useEffect, useMemo} from 'react';
import * as _ from 'lodash/object';
import { Table, openModal, Button, Checkbox, FormatMessage } from 'components';

import { emptyIndex } from '../../../lib/datasource_util';
import {getPrefix} from '../../../lib/prefixUtil';

export default React.memo(({ prefix, data, dataChange }) => {
  const dataPropsRef = useRef(data);
  dataPropsRef.current = data;
  const tableRef = useRef({});
  const commonProps = {
    // 禁用表头拖动排序
    // 禁用表头图标（后续可支持自定义表头图标）
    // 使用自定义的表头，无需从数据获取
    disableHeaderSort: true,
    disableHeaderIcon: true,
    customerHeaders: true,
    // 关闭表头显示
    hiddenHeader: true,
    otherOpt: false,
    fixHeader: false,
  };
  const currentPrefix = getPrefix(prefix);
  const headers = [
    { refKey: 'defKey', value: FormatMessage.string({id: 'tableHeaders.indexesName'})},
    { refKey: 'unique', value: FormatMessage.string({id: 'tableHeaders.indexIsUnique'})},
    { refKey: 'comment', value: FormatMessage.string({id: 'tableHeaders.indexComment'})}];
  const stateData = useRef(data?.indexes || []);
  const tableDataGroupChange = (groupData) => {
    stateData.current = groupData.map((g) => {
      return {
        ..._.omit(g, ['children']),
        fields: (stateData.current.filter(f => f.id === g.id)[0]?.fields || [])
          .map(f => _.omit(f, ['defKey', 'defName'])),
      };
    });
    dataChange && dataChange(stateData.current, 'indexes');
  };
  const _dataChange = (tableData, groupData) => {
    stateData.current = stateData.current.map((g) => {
      if (g.id === groupData.id) {
        return {
          ..._.omit(g, ['children']),
          fields: tableData.map(f => _.omit(f, ['defKey', 'defName'])),
        };
      }
      return g;
    });
    dataChange && dataChange(stateData.current, 'indexes');
  };
  const onAdd = (d) => {
    return new Promise((res) => {
      let modal = null;
      let checkedFields = [];
      const checkChange = (e, id) => {
        if (e.target.checked && !checkedFields.includes(id)) {
          checkedFields.push(id);
        } else if (!e.target.checked && checkedFields.includes(id)) {
          checkedFields = checkedFields.filter(f => f !== id);
        }
      };
      const onOK = () => {
        res(dataPropsRef.current?.fields?.filter(f => checkedFields.includes(f.id))
            .map(field => ({
              fieldDefKey: field.id,
              ascOrDesc: 'A',
              id: Math.uuid(),
              defKey: field.defKey,
              defName: field.defName,
            })));
        modal && modal.close();
      };
      const onCancel = () => {
        modal && modal.close();
      };
      const currentIndex = stateData.current.filter(i => i.id === d.id)[0];
      modal = openModal(<div className={`${currentPrefix}-entity-indexes-right-import`}>{
        dataPropsRef.current?.fields?.filter(f => !(currentIndex?.fields || [])
          .map(dF => dF.fieldDefKey).includes(f.id))
          .map(f => (
            <div
              key={f.id}
            >
              <Checkbox onChange={e => checkChange(e, f.id)}/>
              {`${f.defKey}[${f.defName}]`}
            </div>
          ))
      }</div>, {
        title: FormatMessage.string({id: 'tableEdit.importFields'}),
        buttons: [
          <Button key='onOK' onClick={onOK} type='primary'>
            <FormatMessage id='button.ok'/>
          </Button>,
          <Button key='onCancel' onClick={onCancel}>
            <FormatMessage id='button.cancel'/>
          </Button>,
        ],
      });
    });
  };
  const ready = (table, id) => {
    tableRef.current[id] = table;
  };
  const getChildren = (d) => {
    return {
      ...d,
      children: <Table
        {...commonProps}
        ready={table => ready(table, d.id)}
        className={`${currentPrefix}-entity-indexes-children-table`}
        tableDataChange={newData => _dataChange(newData, d)}
        disableCopyAndCut
        onAdd={() => onAdd(d)}
        data={{
          headers: [
            { refKey: 'defKey', value: FormatMessage.string({id: 'tableHeaders.indexesFieldKey'}), com: 'label' },
            { refKey: 'defName', value: FormatMessage.string({id: 'tableHeaders.indexesFieldsName'}), com: 'label' },
            { refKey: 'ascOrDesc', value: FormatMessage.string({id: 'tableHeaders.indexesFieldsName'}), com: 'select' },
          ],
          fields: (d.fields || [])
            .map((k) => {
              const entityField = data?.fields?.
              filter(f => f.id === k.fieldDefKey)[0];
              if (entityField) {
                return {
                  ...k,
                  defKey: entityField.defKey,
                  defName: entityField.defName,
                };
              }
              return null;
            })
            .filter(f => !!f),
        }}
      />,
    };
  };
  const onAddIndex = () => {
    return new Promise((resolve) => {
      resolve([getChildren({
        ...emptyIndex,
        id: Math.uuid(),
      })]);
    });
  };
  useEffect(() => {
    Object.keys(tableRef.current).forEach((id) => {
      tableRef.current[id].updateTableData((pre) => {
        return {
          ...pre,
          fields: (pre.fields || [])
            .map((k) => {
              const entityField = data?.fields?.
              filter(f => f.id === k.fieldDefKey)[0];
              if (entityField) {
                return {
                  ...k,
                  defKey: entityField.defKey,
                  defName: entityField.defName,
                };
              }
              return null;
            })
            .filter(f => !!f),
        };
      });
    });
  }, [data?.fields]);
  const dataMemo = useMemo(() => ({
    headers,
    fields: (data?.indexes || []).map(d => getChildren(d)),
  }), []);
  return <div className={`${currentPrefix}-entity-indexes`}>
    <Table
      {...commonProps}
      tableDataChange={tableDataGroupChange}
      hiddenHeader={false}
      onAdd={() => onAddIndex()}
      expand
      data={dataMemo}
    />
  </div>;
});
