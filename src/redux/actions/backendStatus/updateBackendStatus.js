import {
  BACKEND_STATUS_LOADED,
} from '../../actionTypes/backendStatus';

const updateBackendStatus = (experimentId, status) => async (dispatch) => {
  dispatch({
    type: BACKEND_STATUS_LOADED,
    payload: { experimentId, status },
  });
};

export default updateBackendStatus;
