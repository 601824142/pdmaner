import React, { forwardRef, useImperativeHandle, useState, useEffect, useRef } from 'react';
import moment from 'moment';

import './style/index.less';
import {openModal} from 'components';
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
//import {transformTable} from '../../lib/datasource_util';

const VersionInfoBar = React.memo(forwardRef((props, ref) => {
  const { prefix, empty, style, dataSource, versionsData, getLatelyDataSource } = props;
  const versionsDataRef = useRef([]);
  versionsDataRef.current = versionsData;
  const [version, setVersion] = useState(null);
  const [value, setValue] = useState('');
  const currentPrefix = getPrefix(prefix);
  const [pre, setPre] = useState(null);
  const [key, setKey] = useState(Math.uuid());
  const preRef = useRef(null);
  preRef.current = pre;
  const versionRef = useRef(null);
  versionRef.current = version;
  const getResult = (v, p) => {
      return getMessageByChanges(packageChanges(v.data || dataSource,
          p?.data || {entities: [], views: []}), dataSource);
  };
  useImperativeHandle(ref, () => {
      return {
          setVersion: (v, p) => {
              setPre(p);
              setVersion(v ? {...v, result: v.result || getResult(v, p)} : v);
          },
      };
  }, [dataSource]);
  useEffect(() => {
      if (version) {
          const preDataSource = pre?.data || {entities: [], views: []};
          if (version.data) {
              const changes = packageChanges(version.data, preDataSource);
              setValue(getChanges(changes, preDataSource, dataSource));
          } else {
              const result = getLatelyDataSource();
              const changes = result.result.status ?
                  packageChanges(result.dataSource, preDataSource) : [];
              setValue(getChanges(changes, preDataSource, dataSource));
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
  const showChangeData = () => {
      let modal;
      const onCancel = () => {
          modal.close();
      };
      modal = openModal(<CodeEditor
        style={{marginBottom: 10}}
        readOnly
        mode='json'
        width='100%'
        height='70vh'
        value={JSON.stringify(packageChanges(versionRef.current?.data || dataSource,
                preRef.current?.data || {entities: [], views: []}),
            null, 2)}
      />, {
          bodyStyle: {width: '60%'},
          title: FormatMessage.string({id: 'tableBase.model'}),
          buttons: [
            <Button key='cancel' onClick={onCancel}>{FormatMessage.string({id: 'button.close'})}</Button>],
      });
  };
  return (
    <div className={`${currentPrefix}-version-info-container`} style={style}>
      <div className={`${currentPrefix}-version-info`}>
        <div className={`${currentPrefix}-version-info-h`}>
          <span>{version.name}</span>
          <span>{moment(version.date).format('YYYY-M-D HH:mm')}</span>
          <span><Button onClick={showChangeData}><FormatMessage id='tableBase.model'/></Button></span>
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
