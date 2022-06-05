// 桌面版

import fs from 'fs';
import path from 'path';
import moment from 'moment';
import * as _ from 'lodash/object';
import { projectSuffix } from '../../profile';
import {defaultJVM, transform} from './datasource_util';
import { FormatMessage } from 'components';
const { execFile } = require('child_process');

const { ipcRenderer, shell } = require('electron');
const { app, dialog } = require('@electron/remote');

const user_config = 'user_config.json';
const project_config = 'project_config.json';
const base_path = 'userData';
const basePath = app.getPath(base_path);
// 此处分为两个目录 一个为用户的配置信息user_config 一个为通用的项目配置信息project_config
const userConfigPath = basePath + path.sep + user_config;
const projectConfigPath = basePath + path.sep + project_config;
// 执行jar包时输出的json文件路径
const execJarOut = basePath + path.sep;
// 删除整个目录 包括目下的所有文件
const deleteDirectoryFile = (dirPath) => {
  if (fs.existsSync(dirPath)) {
    fs.readdirSync(dirPath).forEach((file) => {
      const curPath = `${dirPath}${path.sep}${file}`;
      if (fs.lstatSync(curPath).isDirectory()) {
        deleteDirectoryFile(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(dirPath);
  }
};
// 判断目录是否存在 如果不存在则创建
export const ensureDirectoryExistence = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    const parentDir = path.dirname(dirPath);
    ensureDirectoryExistence(parentDir);
    fs.mkdirSync(dirPath);
  }
};
// 文件名和路径拼接
export const dirSplicing = (dir, fileName) => {
 return path.join(dir, fileName);
};
// 获取文件所在的目录
export const dirname = (file) => {
  return path.dirname(file);
};
// 判断文件是否已经存在
export const fileExists = (filePath) => {
  return fs.existsSync(filePath);
};
// 删除文件
export const deleteFile = (filePath) => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

export const saveNormalFile = (file, dataBuffer) => {
  // 通用的文件保方法
  return new Promise((res, rej) => {
    // fs.writeFile(file, dataBuffer, (err) => {
    //   if(err){
    //     rej(err);
    //   }else{
    //     res(dataBuffer);
    //   }
    // });
    const writer = fs.createWriteStream(file);
    writer.on('error', (err) => {
      rej(err);
    });
    writer.on('close', () => {
      res(dataBuffer);
    })
    writer.write(dataBuffer);
    writer.end();
  });
};

export const readNormalFile = (filePath) => {
  // 通用的文件读取方法
  return new Promise((res, rej) => {
    fs.readFile(filePath, (err, data) => {
      if (err) {
        rej(err);
      } else {
        res(data);
      }
    });
  })
};

export const saveJsonPromise = (filePath, data) => {
  return new Promise((res, rej) => {
    const tempData = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    const tempFilePath = filePath.endsWith('.json') ? filePath : `${filePath}.json`;
    if (!tempData) {
      rej(new Error('error'));
    } else {
      saveNormalFile(tempFilePath, tempData).then((data) => {
        res(data);
      }).catch((err) => {
        rej(err);
      });
    }
  });
};

export const readJsonPromise = (filePath) => {
  return new Promise((res, rej) => {
    const tempFilePath = filePath.endsWith('.json') ? filePath : `${filePath}.json`;
    readNormalFile(tempFilePath).then((data) => {
      res(JSON.parse(data.toString().replace(/^\uFEFF/, '')));
    }).catch((err) => {
      rej(err);
    });
  });
};

export const saveJsonPromiseAs = (data, refactor) => {
  const tempData = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  const extensions = [`${projectSuffix}.json`];
  return new Promise((res, rej) => {
    saveFile(tempData, [{ name: projectSuffix, extensions: extensions}], (path) => {
      if (!path.endsWith('.json')) {
        return `${path}.${projectSuffix}.json`;
      }else if (!path.endsWith(`.${projectSuffix}.json`)) {
        return path.replace(/\.json$/g, `.${projectSuffix}.json`);
      }
      return path;
    }, {}, refactor).then(({filePath}) => res(filePath)).catch(err => rej(err));
  });
};

export const getUserConfig = () => {
  return new Promise((res, rej) => {
    // 获取用户的配置信息
    const defaultUserConfigData = {
      projectHistories: [], // 历史项目记录
      lang: 'zh', // 当前应用使用的语言
    };
    const defaultProjectConfigData = {
      commonFields: [], // 通用字段信息 多个项目可通用
    };
    /*
    * %APPDATA% Windows 中
    * $XDG_CONFIG_HOME or ~/.config Linux 中
    * ~/Library/Application Support macOS 中
    * */
    const getData = (path, defaultData) => {
      return new Promise((r, j) => {
        readJsonPromise(path).then((data) => {
          r({
            ...defaultData,
            ...data,
          });
        }).catch(() => {
          // 如果用户信息报错 则需要使用默认数据进行覆盖
          saveJsonPromise(path, defaultData).then(() => {
            r(defaultData);
          }).catch((err) => {
            rej(err);
          })
        });
      })
    };
    Promise.all([getData(userConfigPath, defaultUserConfigData),
      getData(projectConfigPath, defaultProjectConfigData)]).then(result => {
        setTimeout(() => {
          res(result);
        }, 1000);
    }).catch((err) => {
      rej(err);
    });
  });
};

export const saveUserConfig = (data = []) => {
  return new Promise((res, rej) => {
    Promise.all([saveJsonPromise(userConfigPath, data[0] || {}),
      saveJsonPromise(projectConfigPath, data[1] || {})]).then((result) => {
      setTimeout(() => {
        res(result);
      }, 100);
    }).catch((err) => {
      rej(err);
    });
  });
};

export const saveFile = (data, filters, fileValidate, options, refactor) => {
  // 将调用系统的目录弹出框
  return new Promise((res, rej) => {
    dialog.showSaveDialog({
      filters: filters || [],
      ...options,
    }).then(({filePath}) => {
      if (filePath) {
        let tempFile = filePath;
        if (fileValidate) {
          // 需要重组文件名
          tempFile = fileValidate(filePath);
        }
        saveNormalFile(tempFile, refactor ? refactor(data, tempFile) : data).then((data) => {
          res({
            data,
            filePath: tempFile,
          });
        }).catch((err) => {
          rej(err);
        })
      } else {
        rej(new Error());
      }
    }).catch((err) => {
      rej(err);
    })
  });
};

export const openFile = (filters) => {
  return new Promise((res, rej) => {
    dialog.showOpenDialog({
      filters: filters || []
    }).then(({filePaths}) => {
      if (filePaths.length > 0) {
        readNormalFile(filePaths[0]).then((data) => {
          res(data);
        }).catch((err) => {
          rej(err);
        });
      }
    }).catch((err) => {
      rej(err);
    })
  });
};

export const getJavaHome = () => {
  return process.env.JAVA_HOME || process.env.JER_HOME || '';
};

export const openFileOrDirPath = (filters, properties, rest) => {
  return new Promise((res, rej) => {
    dialog.showOpenDialog({
      ...rest,
      filters: filters || [],
      properties: properties || ['openFile'], // 默认是打开文件
    }).then(({filePaths}) => {
      if (filePaths.length > 0) {
        res(filePaths[0])
      }
    }).catch((err) => {
      rej(err);
    })
  });
};

export const openProjectFilePath = (errorFileMessage, suffix) => {
  const tempSuffix = suffix || projectSuffix;
  const extensions = suffix ? [suffix] : [`${projectSuffix}.json`, 'chnr.json'];
  return new Promise((res, rej) => {
    openFileOrDirPath([{ name: tempSuffix, extensions: extensions}]).then((file) => {
      if (extensions.every(e => !file.endsWith(`.${e}`))) {
        // 项目名不符合规范 抛出异常
        rej(new Error(errorFileMessage || 'Invalid project file'));
      } else {
        res(file);
      }
    }).catch((err) => {
      rej(err);
    })
  });
};

const getProject = (project, type) => {
  const tempArray = project.split(path.sep);
  if (type === 'name') {
    return tempArray[tempArray.length - 1].split('.pdman.json')[0];
  }
  return tempArray.splice(0, tempArray.length - 1).join(path.sep);
};

export const getAllVersionProject = (p, data) => {
  // 获取当前项目的所有版本数据
  const versionDir = path.join(path.dirname(p), `.version_${data.name}`);
  if (!fs.existsSync(versionDir)) {
    return Promise.resolve([]);
  }
  return new Promise((res, rej) => {
    fs.readdir(versionDir, (err, files) => {
      if (!err) {
        // 读取所有的文件信息 此处需要过滤其他无效的文件(目前先过滤非json文件，以.开头的文件)
        Promise.all(files
          .filter(f => f.endsWith('.json') && !f.startsWith('.'))
          .map(f => readJsonPromise(path.join(versionDir, f)))).
        then((results) => {
          // 返回的项目信息需要以时间顺序进行排序 最近的放在最前面
          res(results);
        }).catch(() => {
          res([]);
        });
      } else {
        res([]);
      }
    })
  });
};

export const removeAllVersionProject = (project) => {
  // 获取当前项目的所有版本数据
  const proName = getProject(project, 'name');
  const proPath = getProject(project, 'path');
  const proVersionPath = `${proPath}${path.sep}.${proName}.version${path.sep}`;
  deleteDirectoryFile(proVersionPath);
};

export const getPathStep = () => {
  return path.sep;
};

export const execFileCmd = (cmd, params, cb) => {
  execFile(cmd, params,
    {
      maxBuffer: 100 * 1024 * 1024 * 100, // 100M
    },
    (error, stdout, stderr) => {
      cb && cb(error, stdout, stderr);
    });
};

export const connectDB = (dataSource, config, params = {}, cmd, cb) => {
  // 创建临时文件
  const tempParams = {...params};
  const outFile = `${execJarOut}${moment().unix()}.json`;
  const sinerFile = `${execJarOut}${moment().unix()}-siner.json`;
  if ('sinerFile' in tempParams) {
    // 需要创建临时项目文件 转换字段
    const updateFields = (data) => {
      return (data || []).map(e => {
        return {
          ...e,
          fields: (e.fields || []).map(f => {
            return {
              ...f,
              ...transform(f, dataSource),
            };
          })
        }
      })
    };
    fs.writeFileSync(sinerFile, JSON.stringify({
      ...dataSource,
      entities: updateFields(dataSource.entities),
      views: updateFields(dataSource.views),
    }));
    tempParams.sinerFile = sinerFile;
  }
  console.log(outFile);
  const getParam = (params) => {
    const paramArray = [];
    Object.keys(params).forEach((p) => {
      if (p !== 'customer_driver') {
        const param = params[p] || '';
        const value = param.includes(' ') ? `"${param}"` : param;
        paramArray.push(`${p}='${value}'`);
      } if (p === 'driver') {
        paramArray.push(`driver_class_name='${params[p]}'`);
      }
    });
    return paramArray.concat(`out='${outFile}'`);
  };
  const javaHome = config?.javaHome || _.get(dataSource, 'profile.javaHome', '');
  const jvm = ('jvm' in (config || {})) ? config.jvm : defaultJVM;
  const jar = ipcRenderer.sendSync('jarPath');
  const tempValue = javaHome ? `${javaHome}${path.sep}bin${path.sep}java` : 'java';
  const customerDriver = _.get(tempParams, 'customer_driver', '');
  const commend = [
    '-Dfile.encoding=utf-8',
    ...jvm.split(' '),
    '-jar', jar, cmd,
    ...getParam(tempParams),
  ];
  if (customerDriver) {
    commend.unshift(`-Xbootclasspath/a:${customerDriver}`);
  }
  return execFile(tempValue, commend,
    {
      maxBuffer: 100 * 1024 * 1024 * 100, // 100M
    },
    (error, stdout, stderr) => {
      if('sinerFile' in tempParams) {
        // 删除临时项目文件
        deleteFile(sinerFile);
      }
      if (params.imgDir) {
        // 删除临时文件夹
        deleteDirectoryFile(params.imgDir);
      }
      if (error) {
        let tempError = error.message || stderr || stdout;
        if (/spawn .* ENOENT/.test(tempError)) {
          tempError = FormatMessage.string({id: 'config.JavaHomeConfigResult.notFoundJDK'});
        } else if (/java\.lang\.OutOfMemoryError/.test(tempError)) {
          tempError = FormatMessage.string({id: 'config.JavaHomeConfigResult.outOfMemoryError'});
        }
        cb && cb({
          status : "FAILED",
          body: tempError,
        });
      } else {
        readJsonPromise(outFile).then((d) => {
          cb && cb(d);
        }).catch(err => {
          cb && cb({
            status : "FAILED",
            body : err.message,
          });
        }).finally(() => {
          // 删除该文件
          deleteFile(outFile);
        });
      }
      //const result = (stdout || stderr || error.message);
      //cb && cb(error ? result : null);
    });
};

export const copyFile = (defaultPath, filters) => {
  return new Promise((res, rej) => {
    dialog.showSaveDialog({
      filters: filters || []
    }).then(({filePath}) => {
      if (filePath) {
        fs.copyFile(defaultPath, filePath, (err) => {
          if (!err) {
            res(filePath);
          } else {
            rej(err);
          }
        });
      }
    }).catch((err) => {
      rej(err);
    });
  });
};

export const saveTempImages = (images) => {
  // 创建临时目录
  const userConfigPath = basePath + path.sep + 'temp_img';
  ensureDirectoryExistence(userConfigPath);
  return new Promise((res, rej) => {
    Promise.all(images.map(i => {
      const filePath = userConfigPath + path.sep + (i.group ? `${i.group}-${i.fileName}` : i.fileName) + '.png';
      return saveNormalFile(filePath, i.data);
    })).then(() => {
      res(userConfigPath);
    }).catch((err) => {
      rej(err);
    })
  });
};

const getDefaultWordTemplate = () => {
  return ipcRenderer.sendSync('docx');
}

export const saveAsWordTemplate = () => {
  return copyFile(getDefaultWordTemplate(), [{name: 'PDManer-docx-tpl', extensions: ['docx']}]);
};

export const selectWordFile = (dataSource) => {
  const template = _.get(dataSource, 'profile.generatorDoc.docTemplate');
  const name = _.get(dataSource, 'name');
  let defaultPath = template || getDefaultWordTemplate();
  return new Promise((res, rej) => {
    openFileOrDirPath([], ['openDirectory']).then((dir) => {
      res([`${dir}${path.sep}${name}-${moment().format('YYYYMDHHmmss')}.docx`, defaultPath]);
    });
  })
};

export const writeLog = (err) => {
  const logPath = `${basePath}${path.sep}${moment().format('YYYY-M-D-HH-mm-ss')}-error-log.txt`;
  return new Promise((res) => {
    saveNormalFile(logPath,err.stack)
        .then(() => res(logPath))
  });
};

export const getLogPath = () => {
  return path.join(app.getPath('home'), '/logs/chiner');
}

export const showItemInFolder = () => {
  shell.openPath(getLogPath());
}

export const showErrorLogFolder = (file) => {
  shell.openPath(file);
}

export const basename = (fileName, extension) => {
  return path.basename(fileName, extension);
}

export const getBackupAllFile = ({core, config}, callback) => {
  if (core.info && config.autoBackup) {
    const dir = path.join(path.dirname(core.info), `.back_${core.data.name}`);
    // 文件名-backup-${年月日时分秒}.chnr.json
    //const name = basename(core.info, '.json');
    ensureDirectoryExistence(dir);
    const reg = new RegExp(`${core.data.name}-backup-\(\\d)+.pdma.json`);
    fs.readdir(dir, (error, files) => {
      if (!error) {
        const allFiles = files.filter(f => reg.test(f)).sort((a, b) => {
          return moment(a.match(/(\d)+/)[0]).isAfter(b.match(/(\d)+/)[0]);
        });
        if (allFiles.length >= config.autoBackup) {
          // 删除最旧的
          fs.unlinkSync(path.join(dir, allFiles[0]));
        }
        const fileName = `${core.data.name}-backup-${moment().format('YYYYMDHHmmss')}.pdma.json`;
        fs.writeFileSync(path.join(dir, fileName), JSON.stringify(core.data, null, 2));
        callback && callback();
      } else {
        callback && callback();
      }
    });
  } else {
    callback && callback();
  }
};

export const deleteVersion = (versionData, dataSource, info) => {
  const versionDir = path.join(path.dirname(info), `.version_${dataSource.name}`);
  const oldVersionPath = path.join(versionDir, `${versionData.name}.json`);
  if (fs.existsSync(oldVersionPath)) {
    deleteFile(oldVersionPath);
  }
};

export const saveVersion = (versionData, oldVersion, info, dataSource) => {
  const versionDir = path.join(path.dirname(info), `.version_${dataSource.name}`);
  ensureDirectoryExistence(versionDir);
  if (oldVersion) {
    // 删除原来的数据
    deleteVersion(oldVersion, dataSource, info);
  }
  const filePath = path.join(versionDir, `${versionData.name}.json`);
  return saveJsonPromise(filePath, versionData);
};

export const updateAllVersion = (versionData, info, dataSource) => {
  const versionDir = path.join(path.dirname(info), `.version_${dataSource.name}`);
  return Promise.all(versionData.map(v => {
    const filePath = path.join(versionDir, `${v.name}.json`);
    return saveJsonPromise(filePath, v);
  }));
}

export const renameVersion = (oldFilePath, newFilePath, oldData, newData) => {
  const oldVersionDir = path.join(path.dirname(oldFilePath), `.version_${oldData.name}`);
  const newVersionDir = path.join(path.dirname(newFilePath), `.version_${newData.name}`);
  if (oldVersionDir) {
    ensureDirectoryExistence(newVersionDir);
  }
  fs.readdirSync(oldVersionDir)
      .filter(f => f.endsWith('.json') && !f.startsWith('.'))
      .forEach(f => {
        fs.renameSync(path.join(oldVersionDir, f), path.join(newVersionDir , f));
  });
  deleteDirectoryFile(oldVersionDir);
};

export const saveAllTemplate = (data, filePath) => {
  try {
    return Promise.all(data.map(d => {
      const file = path.join(filePath, d.suffix);
      ensureDirectoryExistence(dirname(file));
      return new Promise((res, rej) => {
        saveNormalFile(file, d.code).then(() => {
          res(file);
        }).catch(err => rej(err))
      });
    }));
  } catch (e) {
    return Promise.reject(e);
  }
};
