import React from 'react';
import { SimpleTab, FormatMessage } from 'components';

import './style/index.less';
import EntityInit from './EntityInitFields';
import SystemParameter from './SystemParameter';
import FieldConfig from './FieldConfig';
import DictSQLTemplate from './DictSQLTemplate';
//import DbConnect from './DbConnect';
import {getPrefix} from '../../../lib/prefixUtil';

const Components = {
    EntityInit,
  SystemParameter,
    FieldConfig,
  DictSQLTemplate,
  //DbConnect,
};
export default React.memo(({prefix, dataSource, dataChange, updateDataSource,
                             config, getDataSource}) => {
  const configTab = ['EntityInit', 'FieldConfig', 'SystemParameter', 'DictSQLTemplate']
  const currentPrefix = getPrefix(prefix);
  return <SimpleTab
    options={configTab
      .map((d) => {
        const Com = Components[d] || '';
        return {
          key: d,
          title: FormatMessage.string({id: `config.${d}`}) || d,
          content: <Com config={config} getDataSource={getDataSource} updateDataSource={updateDataSource} dataSource={dataSource} prefix={currentPrefix} dataChange={dataChange}/>,
        };
      })}
  />;
});
