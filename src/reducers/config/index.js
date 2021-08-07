import { langType, fail, success } from '../../lib/variable';
import { GET_USER_CONFIG_SUCCESS, GET_USER_CONFIG_FAIL,
  SAVE_USER_CONFIG_SUCCESS } from '../../actions/config';

const config = (state = { lang: langType[0] }, action) => {
  switch (action.type) {
    case GET_USER_CONFIG_SUCCESS:
      return {
        ...state,
        data: action.data,
        javaHome: action.data[0]?.javaHome || '',
        lang: action.data[0]?.lang || langType[0],
        autoSave: action.data[0]?.autoSave || 0,
        jvmMemory: action.data[0]?.jvmMemory || 8,
        result: success,
      };
    case SAVE_USER_CONFIG_SUCCESS:
      return {
        ...state,
        data: action.data,
        javaHome: action.data[0]?.javaHome || '',
        lang: action.data[0]?.lang || langType[0],
        autoSave: action.data[0]?.autoSave || 0,
        jvmMemory: action.data[0]?.jvmMemory || 8,
        result: success,
      };
    case GET_USER_CONFIG_FAIL:
      return {
        ...state,
        data: action.data,
        result: fail,
      };
    default: return {
      ...state,
    }
  }
};

export default config;
