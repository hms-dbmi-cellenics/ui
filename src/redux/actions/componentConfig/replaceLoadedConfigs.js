import { CONFIGS_REPLACED } from 'redux/actionTypes/componentConfig';

const replaceLoadedConfigs = (updatedConfigs) => (dispatch) => {
  dispatch({
    type: CONFIGS_REPLACED,
    payload: { updatedConfigs },
  });
};

export default replaceLoadedConfigs;
