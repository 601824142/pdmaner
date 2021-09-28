import React, {useState, useMemo, useRef, useEffect} from 'react';
import {Step, Button, FormatMessage, Modal, Terminal} from 'components';

import DbSelect from './DbSelect';
import ParseDb from './ParseDb';
import DealData from './DealData';
import './style/index.less';
import {getPrefix} from '../../../../lib/prefixUtil';
import {connectDB, getLogPath, showItemInFolder} from '../../../../lib/middle';

export default React.memo(({prefix, dataSource, dataChange, config, onClose, onOk}) => {
  const dealDataRef = useRef(null);
  const parserRef = useRef(null);
  const [currentKey, updateCurrentKey] = useState(1);
  const parseDbRef = useRef(null);
  const dbConn = dataSource?.dbConn || [];
  const defaultConn = dataSource?.profile?.default?.dbConn || dbConn[0].defKey;
  const dbData = useMemo(() => ({
    defKey: defaultConn,
    flag: 'DEFAULT',
  }), []);
  const parseData = useMemo(() => ({}), []);
  const next = () => {
    updateCurrentKey(currentKey + 1);
    if (parseDbRef.current) {
      parseDbRef.current.parser();
    }
  };
  const dbChange = (e, name) => {
    dbData[name] = e.target.value;
  };
  const getDbData = () => {
    return dbData;
  };
  const getData = () => {
    return parseData;
  };
  const parseError = () => {
    updateCurrentKey(1);
  };
  const parseFinish = (data) => {
    parseData.data = data;
    updateCurrentKey(3);
    dealDataRef.current?.refresh();
  };
  const pre = () => {
    updateCurrentKey(1);
  };
  const onOK = (e, {updateStatus}) => {
    updateStatus('loading');
    const selectedTable = dealDataRef.current.getData()
        .reduce((a, b) => a.concat(b.fields.map(f => ({...f, group: b.id}))), []);
    if (selectedTable.length > 0) {
      const properties = (dbConn.filter(d => d.defKey === dbData.defKey)[0] || {})?.properties
        || {};
      parserRef.current = connectDB(dataSource, config, {
        ...properties,
        tables: selectedTable.map(t => t.originDefKey).join(','),
      }, 'DBReverseGetTableDDL', (data) => {
        updateStatus('normal');
        if (data.status === 'FAILED') {
          const termReady = (term) => {
            term.write(data.body || '');
          };
          Modal.error({
            bodyStyle: {width: '80%'},
            contentStyle: {width: '100%', height: '100%'},
            title: FormatMessage.string({id: 'dbReverseParse.parseDbError'}),
            message: <div>
              <div style={{textAlign: 'center'}}><FormatMessage id='dbConnect.log'/><a onClick={showItemInFolder}>{getLogPath()}</a></div>
              <Terminal termReady={termReady}/>
            </div>,
          });
        } else {
          let tempData = data.body.map((d) => {
            const group = selectedTable.filter(t => t.originDefKey === d.defKey)[0]?.group;
            if (dbData.flag === 'LOWCASE') {
              return {
                ...d,
                group,
                fields: (d.fields || []).map(f => ({...f, defKey: f.defKey?.toLocaleLowerCase()})),
                defKey: d.defKey.toLocaleLowerCase(),
              };
            } else if (dbData.flag === 'UPPERCASE') {
              return {
                ...d,
                group,
                fields: (d.fields || []).map(f => ({...f, defKey: f.defKey?.toLocaleUpperCase()})),
                defKey: d.defKey.toLocaleUpperCase(),
              };
            }
            return {
              ...d,
              group,
            };
          });
          onOk(tempData.map(t => ({
            ...t,
            id: Math.uuid(),
            fields: (t.fields || []).map(f => ({...f, id: Math.uuid()})),
          })), dbData.defKey);
        }
      });
    } else {
      onOk([], dbData.defKey);
    }
  };
  useEffect(() => {
    return () => {
      parserRef.current?.kill(0);
    };
  }, []);
  const currentPrefix = getPrefix(prefix);
  return <div className={`${currentPrefix}-dbreverseparse-db`}>
    <Step
      currentKey={currentKey}
      options={[
        {
          title: FormatMessage.string({id: 'dbReverseParse.dbSelectTitle'}),
          content: <DbSelect
            prefix={prefix}
            dataSource={dataSource}
            dbChange={dbChange}
          />,
          key: 1,
        },
        {
          title: FormatMessage.string({id: 'dbReverseParse.parseDbTitle'}),
          content: <ParseDb
            config={config}
            ref={parseDbRef}
            parseError={parseError}
            getDbData={getDbData}
            prefix={prefix}
            dataSource={dataSource}
            parseFinish={parseFinish}
          />,
          key: 2,
        },
        {title: FormatMessage.string({id: 'dbReverseParse.selectEntity'}),
          content: <DealData
            ref={dealDataRef}
            dataChange={dataChange}
            getData={getData}
            prefix={prefix}
            dataSource={dataSource}
          />,
          key: 3,
        },
        ]}
    />
    <div className={`${currentPrefix}-dbreverseparse-db-opt`}>
      <Button key='onClose' onClick={onClose}>
        <FormatMessage id='button.close'/>
      </Button>
      <Button onClick={next} style={{display: currentKey === 1 ? '' : 'none'}}>
        <FormatMessage id='dbReverseParse.next'/>
      </Button>
      <Button onClick={pre} style={{display: currentKey === 3 ? '' : 'none'}}>
        <FormatMessage id='dbReverseParse.pre'/>
      </Button>
      <Button type='primary' onClick={onOK} style={{display: currentKey === 3 ? '' : 'none'}}>
        <FormatMessage id='button.ok'/>
      </Button>
    </div>
  </div>;
});
