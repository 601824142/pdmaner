import React from 'react';

import './style/index.less';
import {getPrefix} from '../../lib/prefixUtil';

const VersionInfoBar = React.memo((props) => {
  const {version, title, info, prefix } = props;
  const currentPrefix = getPrefix(prefix);
  return (
    <div className={`${currentPrefix}-version-info`}>
      <div className={`${currentPrefix}-version-info-h`}>
        <span>{version}</span>
        <span>{title}</span>
        <span />
      </div>
      <div className={`${currentPrefix}-version-list-card-panel`}>
        {info.map((o, i) => <p key={i}>{o}</p>)}
      </div>
    </div>
  );
});

export default VersionInfoBar;
