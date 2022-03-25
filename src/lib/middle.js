// 打包时判断是否是网页版还是桌面版

//import * as json from './json';

const saveJsonPromise = json.saveJsonPromise;
const readJsonPromise = json.readJsonPromise;
const saveJsonPromiseAs = json.saveJsonPromiseAs;
const getUserConfig = json.getUserConfig;
const saveUserConfig = json.saveUserConfig;
const getJavaHome = json.getJavaHome;
const execFileCmd = json.execFileCmd;
const getPathStep = json.getPathStep;
const openProjectFilePath = json.openProjectFilePath;
const openFileOrDirPath = json.openFileOrDirPath;
const getAllVersionProject = json.getAllVersionProject;
const removeAllVersionProject = json.removeAllVersionProject;
const connectDB = json.connectDB;
const ensureDirectoryExistence = json.ensureDirectoryExistence;
const dirSplicing = json.dirSplicing;
const fileExists = json.fileExists;
const deleteFile = json.deleteFile;
const dirname = json.dirname;
const saveFile = json.saveFile;
const saveTempImages = json.saveTempImages;
const saveAsWordTemplate = json.saveAsWordTemplate;
const selectWordFile = json.selectWordFile;
const writeLog = json.writeLog;
const showItemInFolder = json.showItemInFolder;
const getLogPath = json.getLogPath;
const showErrorLogFolder = json.showErrorLogFolder;
const basename = json.basename;
const getBackupAllFile = json.getBackupAllFile;
const saveVersion = json.saveVersion;
const deleteVersion = json.deleteVersion;
const renameVersion = json.renameVersion;

export {
  saveJsonPromise,
  readJsonPromise,
  saveJsonPromiseAs,
  getUserConfig,
  saveUserConfig,
  openFileOrDirPath,
  getJavaHome,
  execFileCmd,
  getPathStep,
  openProjectFilePath,
  getAllVersionProject,
  removeAllVersionProject,
  connectDB,
  ensureDirectoryExistence,
  dirSplicing,
  fileExists,
  deleteFile,
  dirname,
  saveFile,
  saveTempImages,
  saveAsWordTemplate,
  selectWordFile,
  writeLog,
  showItemInFolder,
  getLogPath,
  showErrorLogFolder,
  basename,
  getBackupAllFile,
  saveVersion,
  deleteVersion,
  renameVersion,
};

