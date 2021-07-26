import React from 'react';
import EntityBasePropertiesList from '../entity/EntityBasePropertiesList';
import {getPrefix} from "../../../lib/prefixUtil";

export default React.memo(({ prefix, dataSource, dataChange }) => {
  const properties = dataSource?.profile?.default?.entityInitProperties || {};
  const currentPrefix = getPrefix(prefix);
  const propertiesChange = (data) => {
    dataChange(data, 'profile.default.entityInitProperties')
  };
  return <div className={`${currentPrefix}-setting-entity-init-properties`}>
    <EntityBasePropertiesList prefix={prefix} properties={properties} propertiesChange={propertiesChange}/>
  </div>
});
