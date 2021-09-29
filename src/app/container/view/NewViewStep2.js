import React, { useState, forwardRef, useImperativeHandle, useEffect } from 'react';
import {FormatMessage, Tree} from 'components';
import {separator} from '../../../../profile';

export default React.memo(forwardRef(({data = [], onChange, getData}, ref) => {
  const [treeData, setTreeData] = useState(data);
  useEffect(() => {
    setTreeData(getData());
  }, []);
  useImperativeHandle(ref,() => {
    return {
      setTreeData,
    };
  } ,[]);
  return <div style={{height: '100%'}}>
    <Tree
      placeholder={FormatMessage.string({id: 'view.fieldSearchPlaceholder'})}
      dataSource={treeData.map(e => ({
          key: e.id,
          value: `${e.defKey}-${e.defName}`,
          children: (e?.fields || []).map(f => ({key: `${e.id}${separator}${f.id}`, value: `${f.defKey}-${f.defName}`})),
        }))}
      onChange={value => onChange(value, 'fields')}
    />
  </div>;
}));

