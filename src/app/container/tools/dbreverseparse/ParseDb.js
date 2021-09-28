import React, {useEffect, forwardRef, useImperativeHandle, useRef} from 'react';

import {Icon, Modal, FormatMessage, Terminal} from 'components';
import {connectDB, getLogPath, showItemInFolder} from '../../../../lib/middle';
import {getPrefix} from '../../../../lib/prefixUtil';

export default React.memo(forwardRef(({prefix, dataSource, getDbData, config,
                                        parseFinish, parseError}, ref) => {
  const parserRef = useRef(null);
  const dbConn = dataSource?.dbConn || [];
  const parser = () => {
    const dbData = getDbData();
    const properties = (dbConn.filter(d => d.defKey === dbData.defKey)[0] || {})?.properties || {};
    parserRef.current = connectDB(dataSource, config, properties, 'DBReverseGetAllTablesList', (data) => {
      if (data.status === 'FAILED') {
        const termReady = (term) => {
          term.write(data.body);
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
        parseError();
      } else {
        let tempData = data.body;
        if (dbData.flag === 'UPPERCASE') {
          tempData = tempData.map(d => ({
            ...d,
            defKey: d.defKey.toLocaleUpperCase(),
            originDefKey: d.defKey,
          }));
        } else if (dbData.flag === 'LOWCASE') {
          tempData = tempData.map(d => ({
            ...d,
            defKey: d.defKey.toLocaleLowerCase(),
            originDefKey: d.defKey,
          }));
        } else {
          tempData = tempData.map(d => ({
            ...d,
            originDefKey: d.defKey,
          }));
        }
        parseFinish(tempData);
      }
    });
  };
  useImperativeHandle(ref, () => {
    return {
      parser,
    };
  }, []);
  useEffect(() => {
    parser();
    return () => {
      parserRef.current?.kill(0);
    };
  }, []);
  const currentPrefix = getPrefix(prefix);
  return <div className={`${currentPrefix}-dbreverseparse-db-parse`}>
    <Icon type='fa-spinner'/><span>
      <FormatMessage id='dbReverseParse.parseDb'/>
    </span>
  </div>;
}));
