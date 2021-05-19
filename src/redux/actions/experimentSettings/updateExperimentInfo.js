import {
  EXPERIMENT_SETTINGS_INFO_UPDATE,
} from '../../actionTypes/experimentSettings';

const updateExperimentInfo = (experimentInfo) => async (dispatch) => {
  dispatch({
    type: EXPERIMENT_SETTINGS_INFO_UPDATE,
    payload: experimentInfo,
  });
};

export default updateExperimentInfo;
