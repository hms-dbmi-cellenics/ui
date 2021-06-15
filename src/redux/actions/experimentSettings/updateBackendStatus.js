import {
  EXPERIMENT_SETTINGS_BACKEND_STATUS_LOADED,
} from '../../actionTypes/experimentSettings';

const updateBackendStatus = (experimentId, status) => async (dispatch) => {
  dispatch({
    type: EXPERIMENT_SETTINGS_BACKEND_STATUS_LOADED,
    payload: {
      experimentId,
      status,
    },
  });
};

export default updateBackendStatus;
