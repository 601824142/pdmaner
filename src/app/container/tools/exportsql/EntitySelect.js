import React, { forwardRef, useImperativeHandle, useRef } from 'react';

import {FormatMessage, Tree} from 'components';

import { separator } from '../../../../../profile';
import {firstUp} from '../../../../lib/string';

export default React.memo(forwardRef(({dataSource, defaultCheckeds, prefix, templateType}, ref) => {
  const checkedsRef = useRef([]);
  useImperativeHandle(ref, () => {
    return {
      getCheckeds: () => {
        return checkedsRef.current;
      },
    };
  }, []);
  const calcUnGroupDefKey = (name) => {
    const allGroupKeys = (dataSource.viewGroups || [])
        .reduce((a, b) => a.concat(b[`ref${firstUp(name)}`]), []);
    return (dataSource[name] || [])
        .filter(e => !(allGroupKeys.includes(e.defKey)))
        .map(e => e.defKey);
  };
  const getTreeData = () => {
    const refData = {};
    if (templateType === 'dict') {
      refData.refDicts = calcUnGroupDefKey('dicts');
    } else {
      refData.refEntities = calcUnGroupDefKey('entities');
      refData.refViews = calcUnGroupDefKey('views');
    }
    return (dataSource.viewGroups || [])
        .concat({
          defKey: '__ungroup',
          defName: FormatMessage.string({id: 'exportSql.defaultGroup'}),
          ...refData,
        })
        .filter((g) => {
          if (templateType === 'dict') {
            return ((g.refDicts || []).length > 0);
          }
          return ((g.refEntities || []).length > 0) || ((g.refViews || []).length > 0);
        })
        .map((g) => {
      const getData = dataName => (dataSource[dataName] || [])
          .filter(e => (g[`ref${firstUp(dataName)}`] || []).includes(e.defKey));
      const children = templateType === 'dict' ? getData('dicts').map(d => ({
        key: `${g.defKey}${separator}dicts${separator}${d.defKey}`,
        value: `${d.defName}(${d.defKey})`,
      })) : [{
        key: `${g.defKey}${separator}entities`,
        value: FormatMessage.string({id: 'exportSql.entityList'}),
        children: getData('entities').map(d => ({
          key: `${g.defKey}${separator}entities${separator}${d.defKey}`,
          value: `${d.defName}(${d.defKey})`,
        })),
      }, {
        key: `${g.defKey}${separator}views`,
        value: FormatMessage.string({id: 'exportSql.viewList'}),
        children: getData('views').map(d => ({
          key: `${g.defKey}${separator}views${separator}${d.defKey}`,
          value: `${d.defName}(${d.defKey})`,
        })),
      }].filter(c => c.children.length > 0);
      return {
        key: g.defKey,
        value: g.defName || g.defKey,
        children,
      };
    });
  };
  const onChange = (keys) => {
    checkedsRef.current = keys;
  };
  return <div className={`${prefix}-export-sql-entity-select`}>
    <Tree
      dataSource={getTreeData()}
      defaultCheckeds={defaultCheckeds}
      onChange={onChange}
    />
  </div>;
}));
