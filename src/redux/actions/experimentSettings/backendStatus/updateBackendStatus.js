import {
  EXPERIMENT_SETTINGS_BACKEND_STATUS_LOADED,
} from '../../../actionTypes/experimentSettings';

const updateBackendStatus = (status) => async (dispatch) => {
  dispatch({
    type: EXPERIMENT_SETTINGS_BACKEND_STATUS_LOADED,
    payload: { status },
  });
};

export default updateBackendStatus;
