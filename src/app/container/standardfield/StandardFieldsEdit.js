import React, {useMemo, useEffect, useRef, useState, useCallback} from 'react';
import {
  Table,
} from 'components';
import  _ from 'lodash/object';
import {addDomResize, removeDomResize} from '../../../lib/listener';
import {getPrefix} from '../../../lib/prefixUtil';
import {
  emptyStandardGroup,
  getStandardGroupColumns,
  getFullColumns,
} from '../../../lib/datasource_util';


export default React.memo(({prefix, dataChange, dataSource, twinkle, updateDataSource}) => {
  const id = useMemo(() => Math.uuid(), []);
  const tableRef = useRef(null);
  const standardFields = useMemo(() => (dataSource.standardFields || []), []);
  const newDataRef = useRef(standardFields);
  const [width, setWidth] = useState(0);
  const resizeDomRef = useRef(null);
  useEffect(() => {
    addDomResize(resizeDomRef.current, id, () => {
      setWidth(resizeDomRef.current.clientWidth - 40);
    });
    return () => {
      removeDomResize(resizeDomRef.current, id);
    };
  }, []);
  const currentPrefix = getPrefix(prefix);
  const tableDataChange = (groupData, tableData) => {
    newDataRef.current = newDataRef.current.map((g) => {
      if (g.id === groupData.id) {
        return {
          ..._.omit(g, ['children']),
          fields: tableData,
        };
      }
      return g;
    });
    dataChange && dataChange(newDataRef.current);
  };
  const tableDataGroupChange = (groupData) => {
    newDataRef.current = groupData.map((g) => {
      return {
        ..._.omit(g, ['children']),
        fields: newDataRef.current.filter(f => f.id === g.id)[0]?.fields || [],
      };
    });
    dataChange && dataChange(newDataRef.current);
  };
  const commonProps = {
    disableHeaderIcon: true,
    customerHeaders: true,
    disableHeaderSort: true,
    disableHeaderReset: true,
    disableAddStandard: true,
    fixHeader: false,
  };
  const getDataSource = () => {
    return dataSource;
  };
  const getChildren = (g) => {
    return {
      ...g,
      children: <div style={{width}}>
        <Table
          {...commonProps}
          updateDataSource={updateDataSource}
          getDataSource={getDataSource}
          data={{
              headers: getFullColumns(),
              fields: g.fields,
            }}
          dataSource={dataSource}
          tableDataChange={tableData => tableDataChange(g, tableData)}
        />
      </div>,
    };
  };
  const onAdd = () => {
    return new Promise((res) => {
      res([getChildren({...emptyStandardGroup, id: Math.uuid()})]);
    });
  };
  useEffect(() => {
    const data = {
      headers: getStandardGroupColumns(),
      fields: standardFields.map(g => getChildren(g)),
    };
    tableRef.current.updateTableData((pre) => {
      const temp = pre.fields ? pre : data;
      return {
        ...temp,
        fields: (temp.fields || []).map(g => getChildren(g)),
      };
    });
  }, [width]);
  const ready = (table) => {
    tableRef.current = table;
  };
  const search = useCallback((f, value) => {
    const reg = new RegExp((value || '').replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
    if (f.fields && f.fields.some(field => reg.test(field.defName) || reg.test(field.defKey))) {
      return true;
    }
    return reg.test(f.defName) || reg.test(f.defKey);
  }, []);
  return <div className={`${currentPrefix}-standard-fields`} ref={resizeDomRef}>
    <Table
      {...commonProps}
      //updateDataSource={updateDataSource}
      getDataSource={getDataSource}
      twinkle={twinkle}
      otherOpt={false}
      onAdd={onAdd}
      style={{width: '100%'}}
      tableDataChange={tableDataGroupChange}
      expand
      ready={ready}
      search={search}
    />
  </div>;
});
