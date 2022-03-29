import React from 'react';
import {FormatMessage, Input, Text} from 'components';
import {getPrefix} from '../../lib/prefixUtil';

export default React.memo(({prefix, data = {}, onChange}) => {
    const currentPrefix = getPrefix(prefix);
    return <div className={`${currentPrefix}-form`} style={{padding: 10}}>
      <div className={`${currentPrefix}-form-item`}>
        <span
          className={`${currentPrefix}-form-item-label`}
          title={FormatMessage.string({id: 'versionData.name'})}
            >
          <span className={`${currentPrefix}-form-item-label-require`}>{}</span>
          <FormatMessage id='versionData.name'/>
        </span>
        <span className={`${currentPrefix}-form-item-component`}>
          <Input placeholder='v1.0.0' maxLength={64} defaultValue={data.name} onChange={e => onChange(e, 'name')}/>
        </span>
      </div>
      <div className={`${currentPrefix}-form-item`}>
        <span
          className={`${currentPrefix}-form-item-label`}
          title={FormatMessage.string({id: 'versionData.data'})}
            >
          <FormatMessage id='versionData.data'/>
        </span>
        <span className={`${currentPrefix}-form-item-component`}>
          <Text preventEnter defaultValue={data.desc} onChange={e => onChange(e, 'desc')}/>
        </span>
      </div>
    </div>;
});
