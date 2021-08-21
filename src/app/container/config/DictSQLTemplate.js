import React from 'react';
import _ from 'lodash/object';
import {getPrefix} from '../../../lib/prefixUtil';
import CodeEditorContent from '../database/CodeEditorContent';

export default React.memo(({prefix, dataSource, dataChange}) => {
  const codeTemplates = _.get(dataSource, 'profile.codeTemplates', []);
  const currentTemplate = codeTemplates.filter(c => c.applyFor === 'dictSQLTemplate')[0] || {};
  const currentPrefix = getPrefix(prefix);
  const onChange = (e) => {
    dataChange && dataChange(e.target.value || '', 'dictSQLTemplate');
  };
  return <div className={`${currentPrefix}-setting-dict`}>
    <CodeEditorContent
      templateShow='dictSQLTemplate'
      value={currentTemplate.content || ''}
      prefix={currentPrefix}
      width='auto'
      height='48vh'
      onChange={onChange}
    />
  </div>;
});
