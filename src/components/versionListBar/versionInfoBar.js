import React, { forwardRef, useImperativeHandle, useState, useEffect, useRef } from 'react';
import moment from 'moment';

import './style/index.less';
import {getPrefix} from '../../lib/prefixUtil';
import CodeEditor from '../codeeditor';
import Button from '../button';
import FormatMessage from '../formatmessage';
import {
    packageChanges,
    genSelByDiff,
    getChanges,
    getMessageByChanges,
} from '../../lib/datasource_version_util';
import { Download } from '../download';
import {getMemoryCache} from '../../lib/cache';

const VersionInfoBar = React.memo(forwardRef((props, ref) => {
  const { prefix, empty, style, dataSource, versionsData, getLatelyDataSource } = props;
  const versionsDataRef = useRef([]);
  versionsDataRef.current = versionsData;
  const [version, setVersion] = useState(null);
  const [value, setValue] = useState('');
  const currentPrefix = getPrefix(prefix);
  const [pre, setPre] = useState(null);
  const [key, setKey] = useState(Math.uuid());
  const getResult = (v, p) => {
      return getMessageByChanges(packageChanges(v.data,
          p?.data || {entities: [], views: []}), v.data);
  };
  useImperativeHandle(ref, () => {
      return {
          setVersion: (v, p) => {
              setPre(p);
              setVersion(v ? {...v, result: v.result || getResult(v, p)} : v);
          },
      };
  }, []);
  useEffect(() => {
      if (version) {
          if (Object.keys(version).length === 1) {
              const result = getLatelyDataSource();
              const changes = result.result.status ?
                  packageChanges(result.dataSource, versionsDataRef.current[0]?.data) : [];
              setValue(getChanges(changes, versionsDataRef.current[0]?.data, result.dataSource));
          } else {
              setValue(genSelByDiff(version, pre, dataSource));
          }
      }
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
          {version.result}
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
