import {
  BACKEND_STATUS_LOADED,
} from '../../../actionTypes/backendStatus';

const updateBackendStatus = (status) => async (dispatch) => {
  dispatch({
    type: BACKEND_STATUS_LOADED,
    payload: { status },
  });
};

export default updateBackendStatus;
