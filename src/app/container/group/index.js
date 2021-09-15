import React from 'react';

import { SimpleTab, Tree, FormatMessage } from 'components';

import Base from './Base';

import './style/index.less';
import {getPrefix} from '../../../lib/prefixUtil';

export default React.memo(({prefix, dataSource, dataChange, data}) => {
  const currentPrefix = getPrefix(prefix);
  const getTreeData = (name, formatMessage) => {
    return [{
      key: name,
      value: `${FormatMessage.string({id: `group.${formatMessage}`})}(${(dataSource?.[name] || []).length})`,
      children: (dataSource?.[name] || [])
        .map(d => ({key: d.id, value: `${d.defKey}[${d.defName || d.defKey}]`})),
    }];
  };
  const getDefaultSelect = (name) => {
    return data?.[name] || [];
  };
  return <div className={`${currentPrefix}-group`}>
    <SimpleTab
      type='block'
      options={[
        {
          key: 'base',
          title: FormatMessage.string({id: 'group.base'}),
          content: <Base prefix={prefix} data={data} dataChange={dataChange}/>,
        },
        {
          key: 'refEntities',
          title: FormatMessage.string({id: 'group.refEntities'}),
          content: <Tree
            placeholder={FormatMessage.string({id: 'group.refEntities'})}
            dataSource={getTreeData('entities', 'refEntities')}
            defaultCheckeds={getDefaultSelect('refEntities')}
            onChange={keys => dataChange(keys, 'refEntities')}
          />,
        },
        {
          key: 'refViews',
          title: FormatMessage.string({id: 'group.refViews'}),
          content: <Tree
            placeholder={FormatMessage.string({id: 'group.refViews'})}
            dataSource={getTreeData('views', 'refViews')}
            defaultCheckeds={getDefaultSelect('refViews')}
            onChange={keys => dataChange(keys, 'refViews')}
          />,
        },
        {
          key: 'refDiagrams',
          title: FormatMessage.string({id: 'group.refDiagrams'}),
          content: <Tree
            placeholder={FormatMessage.string({id: 'group.refDiagrams'})}
            dataSource={getTreeData('diagrams', 'refDiagrams')}
            defaultCheckeds={getDefaultSelect('refDiagrams')}
            onChange={keys => dataChange(keys, 'refDiagrams')}
          />,
        },
        {
          key: 'refDicts',
          title: FormatMessage.string({id: 'group.refDicts'}),
          content: <Tree
            placeholder={FormatMessage.string({id: 'group.refDicts'})}
            dataSource={getTreeData('dicts', 'refDicts')}
            defaultCheckeds={getDefaultSelect('refDicts')}
            onChange={keys => dataChange(keys, 'refDicts')}
          />,
        },
      ]}
    />
  </div>;
});
