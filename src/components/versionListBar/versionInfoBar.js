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
    //genSelByDiff,
    getChanges,
    getMessageByChanges, mergeDataSource,
} from '../../lib/datasource_version_util';
import { Download } from '../download';
import {getMemoryCache} from '../../lib/cache';
import {getDefaultDb} from '../../lib/datasource_util';
//import {transformTable} from '../../lib/datasource_util';

const VersionInfoBar = React.memo(forwardRef((props, ref) => {
  const { prefix, empty, style, dataSource, versionsData, getLatelyDataSource } = props;
  const versionsDataRef = useRef([]);
  versionsDataRef.current = versionsData;
  const resizeRef = useRef(null);
  const leftRef = useRef(null);
  const rightRef = useRef(null);
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
      const result = getLatelyDataSource();
      return getMessageByChanges(packageChanges(
          mergeDataSource(v.data || result.dataSource || dataSource, dataSource),
          p?.data || {entities: [], views: []}), dataSource);
  };
  useImperativeHandle(ref, () => {
      return {
          setVersion: (v, p) => {
              setPre(p);
              setVersion(v ? {...v, result: getResult(v, p)} : v);
          },
      };
  }, [dataSource]);
  useEffect(() => {
      if (version) {
          const preDataSource = pre?.data || {entities: [], views: []};
          if (version.data) {
              const changes = packageChanges(mergeDataSource(version.data, dataSource),
                  preDataSource);
              setValue(getChanges(changes, dataSource));
          } else {
              const result = getLatelyDataSource();
              const changes = result.result.status ?
                  packageChanges(mergeDataSource(result.dataSource, dataSource),
                      preDataSource) : [];
              setValue(getChanges(changes, dataSource));
          }
      }
  }, [version, pre, dataSource]);
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
        value={JSON.stringify(packageChanges(mergeDataSource(versionRef.current?.data ||
                getLatelyDataSource()?.dataSource || dataSource, dataSource),
                preRef.current?.data || {entities: [], views: []}),
            null, 2)}
      />, {
          bodyStyle: {width: '60%'},
          title: FormatMessage.string({id: 'tableBase.model'}),
          buttons: [
            <Button key='cancel' onClick={onCancel}>{FormatMessage.string({id: 'button.close'})}</Button>],
      });
  };
  const onMouseMove = (e) => {
      if (resizeRef.current?.move) {
          const offset = e.clientX - resizeRef.current.x;
          leftRef.current.style.width = `${resizeRef.current.left + offset}px`;
          rightRef.current.style.width = `${resizeRef.current.right - offset}px`;
      }
  };
  const onMouseDown = (e) => {
    console.log(e);
    resizeRef.current = {
        move: true,
        x: e.clientX,
        left: leftRef.current.clientWidth,
        right: rightRef.current.clientWidth,
    };
  };
  const onMouseLeave = () => {
      resizeRef.current = {
          move: false,
      };
  };
  return (
    <div
      className={`${currentPrefix}-version-info-container`}
      style={style}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onMouseUp={onMouseLeave}
    >
      <div ref={leftRef} className={`${currentPrefix}-version-info`}>
        <div className={`${currentPrefix}-version-info-h`}>
          <span>{version.name}</span>
          <span>{moment(version.date).format('YYYY-M-D HH:mm')}</span>
          <span><Button onClick={showChangeData}><FormatMessage id='tableBase.model'/></Button></span>
        </div>
        <div className={`${currentPrefix}-version-list-card-panel`}>
          <pre>
            {version.result}
          </pre>
        </div>
      </div>
      <div className={`${currentPrefix}-version-info-scroll`} onMouseDown={onMouseDown}>{}</div>
      <div ref={rightRef} className={`${currentPrefix}-version-info-edit`}>
        <div>
          <Button type='primary' onClick={exportDDL}><FormatMessage id='exportSql.export'/></Button>
          <div className={`${currentPrefix}-version-info-edit-type`}>
            <FormatMessage id='exportSql.current'/>
            <span>{getDefaultDb(dataSource)}</span>
          </div>
        </div>
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
