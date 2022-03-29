import React from 'react';
import * as _ from 'lodash/object';

import { SimpleTab, CodeHighlight, FormatMessage } from 'components';
//import { separator } from '../../../../profile';
import { getCodeByDataTable } from '../../../lib/json2code_util';
import {getPrefix} from '../../../lib/prefixUtil';

const CodeContent = React.memo(({ data, dataSource, group, codeType, codeTemplate}) => {
  const template = codeTemplate.type === 'dbDDL' ? Object.keys(_.pick(codeTemplate,
    ['createTable', 'createIndex', 'createView'].filter((t) => {
      if (codeType === 'view') {
        return t !== 'createTable';
      }
      return t !== 'createView';
    }), {})) : Object.keys(_.omit(codeTemplate, ['type', 'applyFor', 'isDefault', 'id', 'defKey']));
  return <SimpleTab
    type='left'
    options={template
      .map((d) => {
        // 过滤无效的变更信息
        return {
          key: d,
          title: codeTemplate.type === 'dbDDL' ? <FormatMessage id={`tableTemplate.${d}`} defaultMessage={d}/> : d,
          content: <CodeHighlight
            mode={d === 'content' ? 'java' : 'mysql'}
            data={() => getCodeByDataTable(dataSource, group, data, codeTemplate.id, d)}
          />,
        };
      })}
  />;
});

export default React.memo(({ dataSource, data, prefix, type, tabName, codeType, ...restProps }) => {
  const dataTypeSupport = _.get(dataSource, 'profile.dataTypeSupports', []);
  const codeTemplates = _.get(dataSource, 'profile.codeTemplates', []);
 /* // 过滤当前的实体变更信息
  const currentChanges = changes.filter(c => c.name.split(separator)[0] === data.defKey);*/
  const currentPrefix = getPrefix(prefix);
  return <div className={`${currentPrefix}-entity-code`}>
    <SimpleTab
      type='block'
      options={dataTypeSupport
        .map((d) => {
            return {
                ...d,
                ...codeTemplates.filter(c => c.applyFor === d.id)[0],
            };
        })
        .filter(d => d.type === codeType)
        .map(d => ({
          key: d.id,
          title: d.defKey,
          content: <CodeContent
            codeType={type}
            data={data}
            codeTemplate={d}
            dataSource={dataSource}
            {...restProps}
          />,
        }))}
    />
  </div>;
});
