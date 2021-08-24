// electron 相关的窗口操作

import { platform } from './middle';

let win = null;

if (platform === 'json') {
  win = require('@electron/remote').getCurrentWindow();
}

// 1.最小化
export const minimize = () => {
  if (process.platform === 'darwin') {
    win.setFullScreen(false);
  }
  win?.minimize();
};

// 2.关闭
export const close = () => {
  win?.close();
};

// 3.开启大小调整
export const resizable = (resizable) => {
  win?.setResizable(resizable);
  if (!resizable) {
    center();
  }
};

// 4.恢复窗口最小大小 移动到屏幕中央
export const center = () => {
  win.setSize(0, 0, true);
  win?.center();
};

// 5.判断窗口是否是最大化
export const isFullScreenable = () => {
  return win?.isFullScreenable();
};

// 6.设置窗口最大化
export const maximize = (flag) => {
  if (flag) {
    if (process.platform === 'darwin') {
      win.setFullScreen(true);
     // win.setWindowButtonVisibility(true);
    } else {
      win.maximize();
    }
  } else {
    if (process.platform === 'darwin') {
      win.setFullScreen(false);
     // win.setWindowButtonVisibility(false);
    } else {
      win.unmaximize();
    }
  }
};

// 7.监听窗口最大化
export const maximizeChange = (enter, leave) => {
  win?.on('enter-full-screen', () => {
   // win.setWindowButtonVisibility(true);
    enter && enter();
  });
  win?.on('leave-full-screen', () => {
   // win.setWindowButtonVisibility(false);
    leave && leave();
  });
  win?.on('unmaximize', () => {
    leave && leave();
  });
  win?.on('maximize', () => {
    enter && enter();
  });
};

// 8.向主进程发送消息
export const sendMessage = (pre, next) => {
  require('electron').ipcRenderer.send('data', JSON.stringify({ pre, next }));
};
