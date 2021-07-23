import React, { useEffect, useRef } from 'react';
import { Icon, Modal, FormatMessage } from 'components';
// eslint-disable-next-line import/named
import { platform } from '../../lib/middle';
import { minimize, close, resizable, maximize, maximizeChange } from '../../lib/electron-window-opt';

import './style/index.less';
import {getPrefix} from '../../lib/prefixUtil';
// 网页版 无需显示该组件
export default React.memo(({prefix, title, resizeable, info}) => {
  const iconRef = useRef(null);
  const currentPrefix = getPrefix(prefix);
  const _close = () => {
    Modal.confirm({
      title: FormatMessage.string({id: 'exitConfirmTitle'}),
      message: FormatMessage.string({id: 'exitConfirm'}),
      onOk:() => {
        close();
      },
    });
  };
  useEffect(() => {
    // 如果是可以调整大小 则需要开启electron的大小调整功能
    if (resizeable) {
      const { current } = iconRef;
      maximizeChange(() => {
        current.setAttribute('class', 'fa fa-window-restore');
      }, () => {
        current.setAttribute('class', 'fa fa-window-maximize');
      });
      resizable(true);
      return () => {
        maximizeChange(null, null);
        resizable(false);
      };
    }
    return () => {};
  }, []);
  const fullScreenClick = () => {
    const { current } = iconRef;
    if (current?.getAttribute('class').includes('fa-window-maximize')) {
      maximize(true);
      current.setAttribute('class', 'fa fa-window-restore');
    } else {
      maximize(false);
      current.setAttribute('class', 'fa fa-window-maximize');
    }
  };
  if (platform === 'json') {
    const darwinClass = process.platform === 'darwin' ? ` ${currentPrefix}-toolbar-title-darwin` : '';
    return <div className={`${currentPrefix}-toolbar`}>
      <span className={`${currentPrefix}-toolbar-title${darwinClass}`}>
        <span>{}</span>
        <span>{title}</span>
        <span className={`${currentPrefix}-toolbar-info`} title={info}>{info}</span>
      </span>
      {
        process.platform !== 'darwin' && <span className={`${currentPrefix}-toolbar-opt`}>
          <Icon type='fa-window-minimize' onClick={minimize}/>
          {
            resizeable ? <Icon type='fa-window-maximize' onClick={fullScreenClick} ref={iconRef}/> : ''
          }
          <Icon type='fa-window-close-o' onClick={_close}/>
        </span>
      }
    </div>;
  }
  return '';
});
