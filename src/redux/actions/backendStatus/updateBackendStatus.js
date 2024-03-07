import {
  BACKEND_STATUS_UPDATED,
} from '../../actionTypes/backendStatus';

const updateBackendStatus = (experimentId, status) => async (dispatch) => {
  dispatch({
    type: BACKEND_STATUS_UPDATED,
    payload: { experimentId, status },
  });
};

export default updateBackendStatus;
