import {
  BACKEND_STATUS_UPDATED,
} from '../../actionTypes/backendStatus';

const updateBackendStatus = (experimentId, status) => async (dispatch) => {
  // Log the payload before dispatching the action
  console.log('Dispatching BACKEND_STATUS_UPDATED with payload:', { experimentId, status });

  dispatch({
    type: BACKEND_STATUS_UPDATED,
    payload: { experimentId, status },
  });
};

export default updateBackendStatus;
