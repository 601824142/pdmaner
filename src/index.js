import React from 'react';
import ReactDOM from 'react-dom';
import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import thunkMiddleware from 'redux-thunk';
import { logger } from 'redux-logger';
import { Modal } from 'components';
import Welcome from './app/welcome';
import reducers from './reducers';
import './style/detault.less';
import { writeLog, showErrorLogFolder } from './lib/middle';
import { sendMessage } from './lib/electron-window-opt';

const store = createStore(reducers,
  {},
  applyMiddleware(
    thunkMiddleware,
    logger,
({getState}) => {
      return next => (action) => {
        // 发送上一次的数据
        const preData = getState();
        next(action);
        const nextData = getState();
        // 发送当前的数据
        sendMessage(preData, nextData);
      };
    },
  ));

class Container extends React.Component{
  componentDidCatch(error) {
    writeLog(error).then((file) => {
      Modal.error({
        title: '出错了',
        message: <span>
          程序出现异常，请前往日志文件查看出错日志：<a onClick={() => showErrorLogFolder(file)}>{file}</a>
        </span>,
      });
    });
  }
  render() {
    return <Welcome store={store}/>;
  }
}

function initComponent() {
  ReactDOM.render(<Provider store={store}>
    <Container/>
  </Provider>, document.getElementById('app'));
}

initComponent();
