import React from 'react';
import { Table, SimpleTab, FormatMessage } from 'components';
import {getPrefix} from '../../../lib/prefixUtil';
import DefaultColumn from './DefaultColumn';
import EntityBasePropertiesList from './EntityInitProperties';

export default React.memo(({ prefix, dataSource, dataChange, updateDataSource, getDataSource }) => {
  const data = dataSource?.profile?.default?.entityInitFields || [];
  const currentPrefix = getPrefix(prefix);
  return <div className={`${currentPrefix}-setting-entity-init-fields`}><SimpleTab
      className={`${currentPrefix}-database-container-tab`}
      options={[
        {
          key: '1',
          title: FormatMessage.string({id: 'config.EntityInitFields'}),
          content: <Table
              disableHeaderIcon
              getDataSource={getDataSource}
              updateDataSource={updateDataSource}
              disableHeaderSort
              disableHeaderReset
              freeze
              data={{
                  fields: data,
                  headers: (dataSource.profile?.headers)
              }}
              dataSource={dataSource}
              tableDataChange={value => dataChange(value, 'profile.default.entityInitFields')}
          />
        },
        {
          key: '2',
          title: FormatMessage.string({id: 'config.EntityBasePropertiesList'}),
          content: <EntityBasePropertiesList dataSource={dataSource} dataChange={dataChange}/>
        },
          {
              key: '3',
              title: FormatMessage.string({id: 'config.EntityInitColumn'}),
              content: <DefaultColumn className={`${currentPrefix}-setting-entity-init-columns`} dataSource={dataSource} columnsChange={value => dataChange(value, 'profile.headers')}/>
          },
      ]}
  /></div>;
});
