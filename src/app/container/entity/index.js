import React, {useEffect, useRef, useState} from 'react';

import { SimpleTab, FormatMessage } from 'components';
import { getEntityOrViewByName } from '../../../lib/datasource_util';
import EntityBase from './EntityBase';
import EntityCode from './EntityCode';
import EntityIndexes from './EntityIndexes';

import './style/index.less';
import {removeDataByTabId} from '../../../lib/cache';
import {getPrefix} from '../../../lib/prefixUtil';
import {subscribeEvent, unSubscribeEvent} from '../../../lib/subscribe';

const Entity = React.memo(({prefix, dataSource, entity, tabDataChange, tabKey,
                             group, BaseExtraCom, customerHeaders, type, getConfig, saveUserData,
                             FieldsExtraOpt, updateDataSource, param, hasRender, hasDestory,
                             getDataSource, openDict}) => {
  const eventId = Math.uuid();
  const [key, setKey] = useState(Math.uuid());
  const [iniData, setInitData] = useState(getEntityOrViewByName(dataSource, entity) || {});
  const [data, updateData] = useState(iniData);
  const dataRef = useRef(data);
  dataRef.current = data;
  useEffect(() => {
    // tab的数据发生变化是需要更新
    const name = 'tabDataChange';
    subscribeEvent(name, ({id, d}) => {
      if (id === entity) {
        setInitData(d);
        updateData(d);
        setKey(Math.uuid());
      }
    }, eventId);
    return () => {
      unSubscribeEvent(name, eventId);
    };
  }, []);
  useEffect(() => () => {
    removeDataByTabId(tabKey);
  }, []);
  useEffect(() => {
    tabDataChange && tabDataChange({
      type: 'entity',
      key: entity,
      data,
      isInit: true,
    });
  }, []);
  const dataChange = (value, name, optType) => {
    updateData((pre) => {
      const tempData = {
        ...pre,
        [name]: value,
      };
      if (optType === 'delete') {
        // 如果是删除字段 需要把对应的索引同时删除
        tempData.indexes = (tempData.indexes || []).map((i) => {
          return {
            ...i,
            fields: (i.fields || [])
              .filter(f => (tempData.fields || [])
                .findIndex(field => field.id === f.fieldDefKey) > -1),
          };
        });
      }
      tabDataChange && tabDataChange({
        type: 'entity',
        key: entity,
        data: {...tempData},
        isInit: false,
      });
      return tempData;
    });
  };
  const getRestData = () => {
    return dataRef.current;
  };
  const currentPrefix = getPrefix(prefix);
  return <div className={`${currentPrefix}-entity`}>
    {/*<div className={`${currentPrefix}-entity-title`}>{entity}</div>*/}
    <div className={`${currentPrefix}-entity-content`} key={key}>
      <SimpleTab
        options={[
          {
            key: 'base',
            title:  FormatMessage.string({id: 'tableEdit.data'}),
            content: <EntityBase
              getRestData={getRestData}
              type={type}
              getDataSource={getDataSource}
              hasRender={hasRender}
              hasDestory={hasDestory}
              param={param}
              customerHeaders={customerHeaders}
              FieldsExtraOpt={FieldsExtraOpt}
              data={iniData}
              dataSource={dataSource}
              BaseExtraCom={BaseExtraCom}
              dataChange={dataChange}
              updateDataSource={updateDataSource}
              openDict={openDict}
            />,
          },
          {
            key: 'indexes',
            title: FormatMessage.string({id: 'tableEdit.indexes'}),
            content: <EntityIndexes
              data={data} // 数据发生变化时需要更新
              prefix={prefix}
              dataChange={dataChange}
            />,
          },
          {
            key: 'dbDDL',
            title: FormatMessage.string({id: 'tableEdit.dbDDL'}),
            content: <EntityCode
              codeType='dbDDL'
              type={type}
              group={group}
              data={data} // 数据发生变化时需要更新
              dataSource={dataSource}
            />,
          },
          {
            key: 'appCode',
            title: FormatMessage.string({id: 'tableEdit.appCode'}),
            content: <EntityCode
              codeType='appCode'
              type={type}
              group={group}
              data={data} // 数据发生变化时需要更新
              dataSource={dataSource}
              getConfig={getConfig}
              saveUserData={saveUserData}
              dataChange={dataChange}
              getDataSource={getDataSource}
              updateDataSource={updateDataSource}
            />,
          },
          ]}
      />
    </div>
  </div>;
});

export default Entity;
