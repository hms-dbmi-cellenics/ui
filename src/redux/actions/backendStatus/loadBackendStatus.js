import handleError from 'utils/http/handleError';
import fetchAPI from 'utils/http/fetchAPI';
import {
  BACKEND_STATUS_LOADING,
  BACKEND_STATUS_LOADED,
  BACKEND_STATUS_ERROR,
} from 'redux/actionTypes/backendStatus';

import endUserMessages from 'utils/endUserMessages';

const loadBackendStatus = (experimentId) => async (dispatch) => {
  dispatch({
    type: BACKEND_STATUS_LOADING,
    payload: {
      experimentId,
    },
  });

  try {
    const status = await fetchAPI(`/v2/experiments/${experimentId}/backendStatus`);

    dispatch({
      type: BACKEND_STATUS_LOADED,
      payload: {
        experimentId,
        status,
      },
    });

    return status;
  } catch (e) {
    const errorMessage = handleError(e, endUserMessages.ERROR_FETCHING_BACKEND_STATUS);

    dispatch({
      type: BACKEND_STATUS_ERROR,
      payload: {
        experimentId,
        error: errorMessage,
      },
    });
  }
};

export default loadBackendStatus;
