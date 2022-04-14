import moment from 'moment';
import _ from 'lodash/object';
//import crypto from 'crypto';

import {
  saveJsonPromise, readJsonPromise, saveJsonPromiseAs, openProjectFilePath, deleteVersion,
  removeAllVersionProject, openFileOrDirPath, ensureDirectoryExistence, saveVersion,
  getAllVersionProject, renameVersion, updateAllVersion,
  dirSplicing, fileExists, deleteFile, basename, writeLog, getBackupAllFile,
} from '../../lib/middle';
import { openLoading, closeLoading, optReset, STATUS } from '../common';
//import { pdman2sino, version2sino } from '../../lib/datasource_util';
import { removeHistory, addHistory, updateHistory } from '../config';
import allLangData from '../../lang';
import { projectSuffix } from '../../../profile';
import emptyProject from '../../lib/template/empty';
import { version } from '../../../package';
import {reduceProject, transformationData} from '../../lib/datasource_util';
import {setMemoryCache} from '../../lib/cache';
import * as template from '../../lib/template';
import {compareVersion} from '../../lib/update';

/*
* 核心的action 负责整个项目的保存和删除
* */

/*
 * action 类型
 */

export const SAVE_PROJECT_SUCCESS = 'SAVE_PROJECT_SUCCESS'; // 保存成功
export const SAVE_PROJECT_FAIL = 'SAVE_PROJECT_FAIL'; // 保存失败

export const READ_PROJECT_SUCCESS = 'READ_PROJECT_SUCCESS'; // 读取成功
export const READ_PROJECT_FAIL = 'READ_PROJECT_FAIL'; // 读取失败

export const CREATE_PROJECT_SUCCESS = 'CREATE_PROJECT_SUCCESS'; // 创建成功
export const CREATE_PROJECT_ERROR = 'CREATE_PROJECT_ERROR'; // 创建失败

export const SAVE_VERSION_SUCCESS = 'SAVE_VERSION_SUCCESS'; // 保存版本信息成功
export const SAVE_VERSION_FAIL = 'SAVE_VERSION_FAIL'; // 保存版本信息失败

export const SAVE_ALL_VERSION_SUCCESS = 'SAVE_ALL_VERSION_SUCCESS';
export const SAVE_ALL_VERSION_FAIL = 'SAVE_ALL_VERSION_FAIL';

export const REMOVE_VERSION_SUCCESS = 'REMOVE_VERSION_SUCCESS'; // 版本信息删除成功

export const REMOVE_ALL_VERSION_SUCCESS = 'REMOVE_ALL_VERSION_SUCCESS'; // 所有版本信息删除成功

export const UPDATE_PROJECT = 'UPDATE_PROJECT'; // 更新项目
export const CLOSE_PROJECT = 'CLOSE_PROJECT'; // 关闭项目

export const UPDATE_PROJECT_INFO = 'UPDATE_PROJECT_INFO'; // 更新项目信息

/*
 * action 创建函数
 */

const saveProjectSuccess = (data) => {
  return {
    type: SAVE_PROJECT_SUCCESS,
    data,
  };
};

const saveProjectFail = (err) => {
  return {
    type: SAVE_PROJECT_FAIL,
    data: err,
  };
};

const readProjectSuccess = (data, versionsData, path, isDemoProject) => {
  return {
    type: READ_PROJECT_SUCCESS,
    data: {
      isDemoProject,
      info: path,
      data,
      versionsData,
    },
  };
};

const readProjectFail = (err) => {
  return {
    type: READ_PROJECT_FAIL,
    data: err,
  };
};

const createProjectSuccess = (data, path) => {
  return {
    type: CREATE_PROJECT_SUCCESS,
    data: {
      info: path,
      data,
      versionsData: [],
    },
  };
};

const createProjectError = (error) => {
  return {
    type: CREATE_PROJECT_ERROR,
    data: error,
  };
};

const saveVersionSuccess = (data, oldData) => {
  return {
    type: SAVE_VERSION_SUCCESS,
    data: { data, oldData },
  };
};

const saveVersionFail = (err) => {
  return {
    type: SAVE_VERSION_FAIL,
    data: err,
  };
};

const removeVersionSuccess = (versionInfo) => {
  return {
    type: REMOVE_VERSION_SUCCESS,
    data: versionInfo,
  };
};

const removeAllVersionSuccess = () => {
  return {
    type: REMOVE_ALL_VERSION_SUCCESS,
  };
};

export const updateProjectInfo = (info) => {
  return {
    type: UPDATE_PROJECT_INFO,
    data: info,
  };
};

export const autoSaveProject = (data) => {
  // 此处为异步操作
  const time = moment().format('YYYY-M-D HH:mm:ss');
  const tempData = {
    ...data,
    updatedTime: time,
    version,
  };
  return (dispatch, getState) => {
    const info = getState()?.core?.info;
    getBackupAllFile(getState(), () => {
      saveJsonPromise(info, tempData)
        .catch((err) => {
          writeLog(err);
        });
    });
  };
};

let isSaving = false;

export const saveProject = (data, saveAs, callback) => {
  if (!isSaving) {
    isSaving = true;
    // 此处为异步操作
    const time = moment().format('YYYY-M-D HH:mm:ss');
    const tempData = {
      ...data,
      createdTime: saveAs ? time : data.createdTime || time,
      updatedTime: time,
      version,
    };
    return (dispatch, getState) => {
      //dispatch(openLoading(title)); // 开启全局loading
      const info = getState()?.core?.info;
      const getName = (p) => {
        const name = basename(p, '.json');
        return name.split('.')[0];
      };
      if (saveAs) {
        saveJsonPromiseAs(tempData, (d, f) => {
          const oldData = JSON.parse(d.toString().replace(/^\uFEFF/, ''));
          oldData.name = getName(f);
          return JSON.stringify(oldData, null, 2);
        }).then((path) => {
          const name = getName(path);
          addHistory({
            describe: tempData.describe || '',
            name,
            avatar: tempData.avatar || '',
            path,
          }, (err) => {
            isSaving = false;
            if (!err) {
              tempData.name = name;
              setMemoryCache('data', tempData);
              callback && callback();
              dispatch(saveProjectSuccess(tempData));
              dispatch(updateProjectInfo(path));
            } else {
              callback && callback(err);
              dispatch(saveProjectFail(err));
            }
          })(dispatch, getState);
        })
          .catch((err) => {
            isSaving = false;
            callback && callback(err);
            dispatch(saveProjectFail(err));
          });
      } else {
        saveJsonPromise(info, tempData)
          .then(() => {
            getBackupAllFile(getState(), () => {
              isSaving = false;
              setMemoryCache('data', tempData);
              callback && callback();
              dispatch(saveProjectSuccess(tempData));
            });
          })
          .catch((err) => {
            isSaving = false;
            callback && callback(err);
            dispatch(saveProjectFail(err));
          });
      }
    };
  }
  return () => {};
};

export const close = () => {
  return {
    type: CLOSE_PROJECT,
  };
};

export const closeProject = (type) => {
  return (dispatch) => {
    dispatch(optReset(type));
    dispatch(close());
  };
};

export const readProject = (path, title, getState, type, isDemoProject) => {
  return (dispatch) => {
    dispatch(openLoading(title)); // 开启全局loading
    readJsonPromise(path)
      .then((data) => {
        if (!data.version) {
          // 无效的项目
          const config = getState()?.config?.data[0];
          const err = new Error(allLangData[config.lang].invalidProjectData);
          dispatch(readProjectFail(err));
          dispatch(closeLoading(STATUS[2], err));
        } else if (!isDemoProject) {
          const newData = transformationData(data);
          // 将打开的项目记录存储到用户信息中
          addHistory({
            describe: newData.describe || '',
            name: newData.name || '',
            avatar: newData.avatar || '',
            path,
          }, (err) => {
            if (!err) {
              setMemoryCache('data', newData);
              getAllVersionProject(path, newData).then((versionData) => {
                dispatch(readProjectSuccess(newData, versionData, path));
              }).catch(() => {
                setMemoryCache('data', newData);
                dispatch(readProjectSuccess(newData, versionData, path));
              }).finally(() => {
                dispatch(closeLoading(STATUS[1], null, '', type));
              });
            } else {
              dispatch(readProjectFail(err));
              dispatch(closeLoading(STATUS[2], err));
            }
          })(dispatch, getState);
        } else {
          const newData = transformationData(data);
          setMemoryCache('data', newData);
          dispatch(readProjectSuccess(newData, [], path, isDemoProject));
          dispatch(closeLoading(STATUS[1], null, '', type));
        }
      })
      .catch((err) => {
        dispatch(readProjectFail(err));
        dispatch(closeLoading(STATUS[2], err));
      });
  };
};

export const openDemoProject = (h, t, title, type) => {
  return (dispatch, getState) => {
    dispatch(openLoading(title));
    let tempH = h;
    let isDemoProject = t || getState().core.isDemoProject;
    if (!tempH) {
      tempH = template[isDemoProject];
    }
    const data = compareVersion('3.5.0', tempH.version.split('.'))
      ? reduceProject(tempH, 'defKey') : tempH;
    setMemoryCache('data', data);
    dispatch(readProjectSuccess(data, [], '', isDemoProject));
    dispatch(closeLoading(STATUS[1], null, '', type));
  };
};

export const openProject = (title, type, path, suffix, isDemoProject) => {
  // 从系统中选择项目 无需传递路径
  return (dispatch, getState) => {
    if (path) {
      readProject(path, title, getState, type)(dispatch);
    } else {
      const config = getState()?.config?.data[0];
      openProjectFilePath(allLangData[config.lang].invalidProjectFile, suffix).then((filePath) => {
        readProject(filePath, title, getState, type, isDemoProject)(dispatch);
      }).catch((err) => {
        dispatch(readProjectFail(err));
      });
    }
  };
};

export const createProject = (data, path, title, type) => {
  return (dispatch, getState) => {
    dispatch(openLoading(title));
    // 如果传递的路径则直接保存 反之则需要选取路径
    new Promise((res, rej) => {
      if (!path) {
        openFileOrDirPath([], ['openDirectory']).then((dir) => {
          res(dir);
        }).catch(rej);
      } else {
        // 校验目录是否存在 如果不存在则需要创建
        ensureDirectoryExistence(path);
        res(path);
      }
    }).then((projectDir) => {
      // 拼接路径和项目名
      const realFilePath = dirSplicing(projectDir, `${data.name}.${projectSuffix}.json`);
      const config = getState()?.config?.data[0];
      if (fileExists(realFilePath)) {
        throw new Error(allLangData[config.lang].createProjectExists);
      } else {
        const time = moment().format('YYYY-M-D HH:mm:ss');
        const newData = {
          ...emptyProject,
          ...data,
          version,
          createdTime: time,
          updatedTime: time,
        };
        saveJsonPromise(realFilePath, newData).then(() => {
          addHistory({
            describe: newData.describe || '',
            name: newData.name || '',
            avatar: newData.avatar || '',
            path: realFilePath,
          }, (err) => {
            if (!err) {
              dispatch(createProjectSuccess(newData, realFilePath));
              dispatch(closeLoading(STATUS[1], null, '', type));
            } else {
             // dispatch(createProjectError(err));
              dispatch(closeLoading(STATUS[2], err));
            }
          })(dispatch, getState);
        }).catch((err) => {
          dispatch(createProjectError(err));
        // dispatch(closeLoading(STATUS[2], err));
        });
      }
    }).catch((err) => {
      dispatch(closeLoading(STATUS[2], err));
     // dispatch(createProjectError(err));
    });
  };
};

export const removeVersionData = (title, versionInfo) => {
  return (dispatch, getState) => {
    const { data, info } = getState()?.core || {};
    dispatch(openLoading(title));
    deleteVersion(versionInfo, data, info);
    dispatch(removeVersionSuccess(versionInfo));
    dispatch(closeLoading(STATUS[1], null));
  };
};

const saveAllVersionSuccess = (data) => {
  return {
    type: SAVE_ALL_VERSION_SUCCESS,
    data,
  };
};

const saveAllVersionFail = (err) => {
  return {
    type: SAVE_ALL_VERSION_FAIL,
    data: err,
  };
};

export const updateAllVersionData = (versionDataCallBack, title, dataSource) => {
  return (dispatch, getState) => {
    const { data, info, versionsData } = getState()?.core || {};
    dispatch(openLoading(title));
    const finalData = versionDataCallBack(versionsData);
    dispatch(autoSaveProject(dataSource));
    updateAllVersion(finalData, info, data).then(() => {
      dispatch(saveAllVersionSuccess(finalData));
      dispatch(closeLoading(STATUS[1], null));
    }).catch((err) => {
      dispatch(saveAllVersionFail(err));
      dispatch(closeLoading(STATUS[2], err));
    });
  };
};

export const removeAllVersionProjectData = (title) => {
  return (dispatch, getState) => {
    const project = getState()?.core?.info;
    dispatch(openLoading(title));
    removeAllVersionProject(project);
    dispatch(removeAllVersionSuccess());
    dispatch(closeLoading(STATUS[1], null));
  };
};

export const updateProject = (data) => {
  return {
    type: UPDATE_PROJECT,
    data,
  };
};

export const renameProject = (newData, oldData, title, dataInfo) => {
  // 判断项目名和项目目录是否已经修改 该方法无只需触发loading操作的action
  return (dispatch, getState) => {
    dispatch(openLoading(title));
    // 1.需要调整项目文件 先新建 再删除
    const oldFilePath = dirSplicing(dataInfo.path, '');
    const newFilePath = dirSplicing(newData.path, `${newData.name}.${projectSuffix}.json`);
    const config = getState()?.config?.data[0];
    if (fileExists(newFilePath) && (oldFilePath !== newFilePath)) {
      dispatch(closeLoading(STATUS[2], allLangData[config.lang].createProjectExists));
    } else {
      saveJsonPromise(newFilePath, _.omit({
        ...oldData,
        ...newData,
        updatedTime: moment().format('YYYY-M-D HH:mm:ss'),
      }, ['path'])).then(() => {
        if (oldFilePath !== newFilePath) {
          // 删除
          deleteFile(oldFilePath);
          // 更新版本文件
          renameVersion(oldFilePath, newFilePath, oldData, newData);
        }
        // 2.需要更新用户配置文件
        updateHistory({
          ...oldData,
          path: oldFilePath,
        }, {
          describe: newData.describe || '',
          name: newData.name || '',
          avatar: newData.avatar || '',
          path: newFilePath,
        })(dispatch, getState);
      }).catch((err) => {
        dispatch(closeLoading(STATUS[2], err));
      });
    }
  };
};

export const removeProject = (data, title) => {
  return (dispatch, getState) => {
    dispatch(openLoading(title));
    // 删除项目
    deleteFile(data.path);
    // 更新历史记录
    removeHistory(data)(dispatch, getState);
  };
};

export const saveVersionData = (versionData, oldVersion, dataSource, title) => {
  return (dispatch, getState) => {
    dispatch(openLoading(title));
    const info = getState()?.core?.info;
    return new Promise((res, rej) => {
      saveVersion(versionData, oldVersion, info, dataSource).then(() => {
        dispatch(saveVersionSuccess(versionData, oldVersion));
        dispatch(closeLoading(STATUS[1], null));
        res(versionData);
      }).catch((err) => {
        dispatch(saveVersionFail(err));
        rej(err);
      });
    });
  };
};
