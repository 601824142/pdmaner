import React from 'react';
import { Table, SimpleTab, FormatMessage } from 'components';
import {getPrefix} from '../../../lib/prefixUtil';
import UiHint from './UiHint';
import EntityBasePropertiesList from '../entity/EntityBasePropertiesList';


export default React.memo(({ prefix, dataSource, dataChange }) => {
    const data = dataSource?.profile?.default?.entityInitFields || [];
    const currentPrefix = getPrefix(prefix);
    return <div className={`${currentPrefix}-setting-entity-init-fields`}><SimpleTab
        className={`${currentPrefix}-database-container-tab`}
        options={[
            {
                key: '1',
                title: FormatMessage.string({id: 'config.UiHint'}),
                content: <UiHint dataSource={dataSource} dataChange={dataChange}/>
            },
            {
                key: '2',
                title: FormatMessage.string({id: 'config.FieldInitProp'}),
                content: <EntityBasePropertiesList className={`${currentPrefix}-setting-entity-init-columns`} properties={dataSource?.profile?.extProps || {}} propertiesChange={(data) => dataChange(data, 'profile.extProps')}/>
            }
        ]}
    /></div>;
});
