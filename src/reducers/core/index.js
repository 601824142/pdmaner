import {
  SAVE_PROJECT_SUCCESS,
  SAVE_PROJECT_FAIL,
  READ_PROJECT_FAIL,
  READ_PROJECT_SUCCESS,
  SAVE_VERSION_SUCCESS,
  REMOVE_VERSION_SUCCESS,
  REMOVE_ALL_VERSION_SUCCESS,
  UPDATE_PROJECT,
  CLOSE_PROJECT,
  CREATE_PROJECT_ERROR,
  CREATE_PROJECT_SUCCESS,
  UPDATE_PROJECT_INFO,
    SAVE_ALL_VERSION_SUCCESS,
    SAVE_ALL_VERSION_FAIL,
} from '../../actions/core';

// 核心的项目编辑或保存
const core = (state = {}, action) => {
  switch (action.type) {
    case SAVE_PROJECT_SUCCESS:
    case UPDATE_PROJECT:
      // 保存或者更新项目
      return {
        ...state,
        data: action.data,
      };
    case SAVE_PROJECT_FAIL:
    case READ_PROJECT_FAIL:
      return {
        ...state,
      };
    case CREATE_PROJECT_ERROR:
      return {
        ...state,
        data: action.data,
      };
    case SAVE_VERSION_SUCCESS:
      return {
        ...state,
        versionsData: state?.versionsData
            ?.filter(v => v.name !== action.data.oldData?.name)
            ?.concat(action.data.data),
      };
    case REMOVE_VERSION_SUCCESS:
      return {
        ...state,
        versionsData: state?.versionsData?.filter(v => v.name !== action?.data?.name),
      };
    case REMOVE_ALL_VERSION_SUCCESS:
      return {
        ...state,
        versionsData: [],
      };
    case SAVE_ALL_VERSION_SUCCESS:
      return {
        ...state,
        versionsData: action.data,
      };
    case SAVE_ALL_VERSION_FAIL:
      return {
        ...state,
      };
    case CLOSE_PROJECT:
      return {};
    case UPDATE_PROJECT_INFO:
      return {
        ...state,
        info: action.data,
      };
    case CREATE_PROJECT_SUCCESS:
    case READ_PROJECT_SUCCESS:
      if (action.data.isDemoProject) {
        return {
          ...action.data,
          info: state.info,
        };
      }
      return {
        ...action.data,
      };
    default:
      return state;
  }
};

export default core;
