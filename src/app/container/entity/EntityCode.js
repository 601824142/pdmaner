import React from 'react';
import * as _ from 'lodash/object';

import { SimpleTab, CodeHighlight, FormatMessage } from 'components';
//import { separator } from '../../../../profile';
import { getCodeByDataTable } from '../../../lib/json2code_util';
import {getPrefix} from '../../../lib/prefixUtil';

const CodeContent = React.memo(({ data, dataSource, group, codeType, dataType }) => {
  const codeTemplate = _.get(dataSource, 'profile.codeTemplates', []).filter(t => t.applyFor === dataType.id)[0];
  const template = Object.keys(_.pick(codeTemplate,
    ['createTable', 'createIndex', 'createView', 'content'].filter((t) => {
      if (codeType === 'view') {
        return t !== 'createTable';
      }
      return t !== 'createView';
    }), {}));
  return <SimpleTab
    type='left'
    options={template
      .map((d) => {
        // 过滤无效的变更信息
        return {
          key: d,
          title: <FormatMessage id={`tableTemplate.${d}`} defaultMessage={d}/>,
          content: <CodeHighlight
            mode={d === 'content' ? 'java' : 'mysql'}
            data={() => getCodeByDataTable(dataSource, group, data, dataType.id, d)}
          />,
        };
      })}
  />;
});

export default React.memo(({ dataSource, data, prefix, type, ...restProps }) => {
  const dataTypeSupport = _.get(dataSource, 'profile.dataTypeSupports', []);
 /* // 过滤当前的实体变更信息
  const currentChanges = changes.filter(c => c.name.split(separator)[0] === data.defKey);*/
  const currentPrefix = getPrefix(prefix);
  return <div className={`${currentPrefix}-entity-code`}>
    <SimpleTab
      type='block'
      options={dataTypeSupport
        .map(d => ({
          key: d.id,
          title: d.defKey,
          content: <CodeContent
            codeType={type}
            dataType={d}
            data={data}
            dataSource={dataSource}
            {...restProps}
          />,
        }))}
    />
  </div>;
});
