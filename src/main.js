/* eslint-disable */
const {app, BrowserWindow, Menu, nativeImage, ipcMain, dialog} = require('electron');
const fs = require('fs');
const path = require('path');
const url = require('url');
require('@electron/remote/main').initialize();
const { autoUpdater } =require("electron-updater");

// 保持一个对于 window 对象的全局引用，如果你不这样做，
// 当 JavaScript 对象被垃圾回收， window 会被自动地关闭
let win;

function createWindow() {
  // 创建浏览器窗口。
  win = new BrowserWindow({
    width: 1180,
    height: 600,
    minWidth: 1180,
    minHeight: 600,
    frame: false,
    resizable: false,
    show: false,
    //titleBarStyle: 'customButtonsOnHover',
    backgroundColor: 'transparent',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    }
  });

  // 然后加载应用的 index.html。
  if (process.env.CHINER_NODE_ENV === 'development') {
    var profile = require('../profile');
    win.loadURL(`http://${profile.host}:${profile.port}/index.html`);
    // 打开开发者工具。
    win.setIcon(
        nativeImage.createFromPath(
            path.join(__dirname, "../public/256x256.png")
        )
    );
    win.webContents.openDevTools();
  } else {
    //win.webContents.openDevTools();
    win.loadURL(url.format({
      pathname: path.join(__dirname, 'index.html'),
      protocol: 'file:',
      slashes: true,
    }));
    win.setIcon(
        nativeImage.createFromPath(
            path.join(__dirname, "256x256.png")
        )
    );
  }
  win.on('ready-to-show', function () {
    win.show();
  });
  let dataCache = {};
  const sendMessage = (reason) => {
    if (dataCache.data && dataCache.info) {
      const dir = path.dirname(dataCache.info);
      const time = new Date(+ new Date() + 8 * 3600 * 1000 ).toJSON()
        .substr(0,19).replace("T","")
        .replaceAll('-', '')
        .replaceAll(':', '');
      fs.writeFile(path.join(dir, `/${dataCache.data.name}-backup-${time}.chnr.json`), JSON.stringify(dataCache.data, null, 2), () => {
        /*dialog.showMessageBox({message: `检测到系统异常，已为您自动备份项目,异常原因:${reason}`, title: '系统异常' }).then(() => {
          app.quit();
        });*/
      });
    }
  }
  autoUpdater.setFeedURL('http://chiner-release.httpchk.com');
  // 更新下载进度事件
  autoUpdater.on('download-progress', function (progressObj) {
    //与渲染进程通信
    win.webContents.send('updateProgress', progressObj);
    win.setProgressBar(progressObj.percent / 100);
  })
  autoUpdater.on('error', (err) => {
    win.webContents.send('updateEnd')
    win.setProgressBar(-1);
  })
  autoUpdater.on('update-downloaded', function () {
    win.setProgressBar(-1);
    autoUpdater.quitAndInstall();
  })
  ipcMain.on('update', () => {
    autoUpdater.checkForUpdates()
  });
  ipcMain.on('data', (e, args ) => {
    try {
      const argData = JSON.parse(args);
      if (argData.next && argData.next.core) {
        dataCache = argData.next.core;
      } else if (argData.pre && argData.pre.core) {
        dataCache = argData.pre.core;
      }
    } catch (e) {

    }
  });
  // 监听进程崩溃 或者网页无响应时
  win.webContents.on('render-process-gone', (event, details ) => {
    sendMessage(details.reason);
  });
  win.webContents.on('unresponsive', () => {
    sendMessage('unresponsive');
  });

  // 当 window 被关闭，这个事件会被触发。
  win.on('closed', () => {
    // 取消引用 window 对象，如果你的应用支持多窗口的话，
    // 通常会把多个 window 对象存放在一个数组里面，
    // 与此同时，你应该删除相应的元素。
    win = null;
  });
  ipcMain.on("jarPath", (event) => {
    let jarPath = '';
    if (process.env.CHINER_NODE_ENV === 'development') {
      jarPath = path.join(__dirname, '../public/jar/chiner-java.jar');
    } else {
      jarPath = path.join(__dirname, '../../app.asar.unpacked/build/jar/chiner-java.jar')
    }
    event.returnValue = jarPath;
  });
  ipcMain.on("docx", (event) => {
    let docx = '';
    if (process.env.CHINER_NODE_ENV === 'development') {
      docx = path.join(__dirname, '../public/file/chiner-docx-tpl.docx');
    } else {
      docx = path.join(__dirname, '../../app.asar.unpacked/build/file/chiner-docx-tpl.docx')
    }
    event.returnValue = docx;
  });
  let menu;
  // 设置菜单
  if (process.platform === 'darwin') {
    const template = [
      {
        role: 'appMenu',
        submenu: [
          {role: 'about'},
          {type: 'separator'},
          {type: 'separator'},
          {role: 'hide'},
          {role: 'hideothers'},
          {role: 'unhide'},
          {type: 'separator'},
          {role: 'quit'}
        ]
      },
      {
        role: 'editMenu',
        submenu: [
          {role: 'undo'},
          {role: 'redo'},
          {type: 'separator'},
          {role: 'cut'},
          {role: 'copy'},
          {role: 'paste'},
          {role: 'pasteandmatchstyle'},
          {role: 'delete'},
          {role: 'selectall'},
          {type: 'separator'},
        ]
      },
      {
        role: 'windowMenu',
        submenu: [
          {role: 'minimize'},
          {role: 'close'},
          {role: 'zoom'},
          {role: 'front'}
        ]
      },
      {
        role: 'help',
        submenu: [
          {
            label: 'Learn More',
            click () { require('electron').shell.openExternal('https://gitee.com/robergroup/chiner') }
          }
        ]
      }
    ]
    menu = Menu.buildFromTemplate(template);
  } else {
    menu = null;
  }
  Menu.setApplicationMenu(menu);
}

// Electron 会在初始化后并准备
// 创建浏览器窗口时，调用这个函数。
// 部分 API 在 ready 事件触发后才能使用。
app.on('ready', createWindow);

// 当全部窗口关闭时退出。
app.on('window-all-closed', () => {
  // 在 macOS 上，除非用户用 Cmd + Q 确定地退出，
  // 否则绝大部分应用及其菜单栏会保持激活。
  if (process.platform !== 'darwin') {
  app.quit();
}
});

app.on('activate', () => {
  // 在macOS上，当单击dock图标并且没有其他窗口打开时，
  // 通常在应用程序中重新创建一个窗口。
  if (win === null) {
  createWindow();
}
});
