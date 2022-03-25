import React, { forwardRef, useImperativeHandle, useState, useEffect } from 'react';
import moment from 'moment';

import './style/index.less';
import {getPrefix} from '../../lib/prefixUtil';
import CodeEditor from '../codeeditor';
import Button from '../button';
import FormatMessage from '../formatmessage';
import { genSelByDiff } from '../../lib/datasource_version_util';
import { Download } from '../download';
import {getMemoryCache} from '../../lib/cache';

const VersionInfoBar = React.memo(forwardRef((props, ref) => {
  const { prefix, empty, style, dataSource } = props;
  const [version, setVersion] = useState(null);
  const [value, setValue] = useState('');
  const currentPrefix = getPrefix(prefix);
  const [pre, setPre] = useState(null);
  const [key, setKey] = useState(Math.uuid());
  useImperativeHandle(ref, () => {
      return {
          setVersion: (v, p) => {
              setPre(p);
              setVersion(v);
          },
      };
  }, []);
  useEffect(() => {
      version && setValue(genSelByDiff(version, pre, dataSource));
  }, [version, pre, dataSource?.profile?.codeTemplates]);
  useEffect(() => {
      setKey(Math.uuid());
  }, [version, dataSource?.profile?.codeTemplates]);
  if(!version) {
      return <div style={style}>{ empty }</div>;
  }
  const _codeChange = (v) => {
      setValue(v);
  };
  const exportDDL = () => {
      Download(
          [value],
          'application/sql', `${getMemoryCache('data').name}-DDL-${moment().format('YYYYMDHHmmss')}.sql`);
  };
  return (
    <div className={`${currentPrefix}-version-info-container`} style={style}>
      <div className={`${currentPrefix}-version-info`}>
        <div className={`${currentPrefix}-version-info-h`}>
          <span>{version.name}</span>
          <span>{moment(version.date).format('YYYY-M-D HH:mm')}</span>
          <span />
        </div>
        <div className={`${currentPrefix}-version-list-card-panel`}>
          {version?.desc?.split('\n')?.map(d => <div key={d}>{d}</div>)}
        </div>
      </div>
      <div className={`${currentPrefix}-version-info-edit`}>
        <div><Button type='primary' onClick={exportDDL}><FormatMessage id='exportSql.export'/></Button></div>
        <CodeEditor
          key={key}
          mode='sql'
          value={value}
          width='auto'
          height='calc(100vh - 135px)'
          onChange={e => _codeChange(e.target.value)}
          />
      </div>
    </div>
  );
}));

export default VersionInfoBar;
