import React, { useState } from 'react';
import { Input, Icon, Button, Modal, FormatMessage } from 'components';

import { openFileOrDirPath, getJavaHome, execFileCmd, getPathStep } from '../../../lib/middle';
import {getPrefix} from '../../../lib/prefixUtil';

export default React.memo(({ prefix, dataSource, dataChange, config }) => {
  const javaHome = config?.javaHome || dataSource?.profile?.javaHome || getJavaHome();
  const [value, updateValue] = useState(javaHome);
  const onChange = (e) => {
    updateValue(e.target.value);
    dataChange && dataChange(e.target.value, 'javaHome');
  };
  const selectDir = () => {
    openFileOrDirPath([], ['openDirectory']).then((res) => {
      updateValue(res);
      dataChange && dataChange(res, 'javaHome');
    }).catch((err) => {
      Modal.error({
        title: FormatMessage.string({id: 'openDirError'}),
        message: err.message || err
      });
    });
  };
  const test = (e, btn) => {
    const split = getPathStep();
    const tempValue = value ? `${value}${split}bin${split}java` : 'java';
    btn && btn.updateStatus('loading');
    execFileCmd(tempValue, ['-version'], (error, stderr, stdout) => {
      btn && btn.updateStatus('normal');
      if (error) {
        Modal.error({
          title: FormatMessage.string({id: 'config.JavaHomeConfigResult.error'}), message: error.message
        });
      } else {
        Modal.success({
          title: FormatMessage.string({id: 'config.JavaHomeConfigResult.success'}),
          message: <div>{stdout}</div>,
        });
      }
    });
  };
  const currentPrefix = getPrefix(prefix);
  return <div className={`${currentPrefix}-setting-java-home`}>
    <div className={`${currentPrefix}-form-item`}>
      <span
        className={`${currentPrefix}-form-item-label`}
        title={'JAVA_HOME'}
      >
        JAVA_HOME
      </span>
      <span className={`${currentPrefix}-form-item-component`}>
        <Input
          placeholder={FormatMessage.string({id: 'config.JavaHomeConfigResult.placeholder'})}
          onChange={onChange}
          value={value}
          suffix={<span className={`${currentPrefix}-setting-java-home-opt`}>
            <Icon type='fa-ellipsis-h' onClick={selectDir} title={FormatMessage.string({id: 'openDir'})}/>
            <Button onClick={test}>
              <FormatMessage id='button.test'/>
            </Button>
            <span onClick={() => require('electron').shell.openExternal('https://jingyan.baidu.com/article/6dad5075d1dc40a123e36ea3.html')}>
               <Icon type='icon-xinxi'/>
            </span>
          </span>}
        />
      </span>
    </div>
  </div>;
});
