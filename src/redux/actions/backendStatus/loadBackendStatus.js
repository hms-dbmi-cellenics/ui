import fetchAPI from '../../../utils/fetchAPI';
import endUserMessages from '../../../utils/endUserMessages';
import { isServerError, throwIfRequestFailed } from '../../../utils/fetchErrors';
import {
  BACKEND_STATUS_LOADING,
  BACKEND_STATUS_LOADED,
  BACKEND_STATUS_ERROR,
} from '../../actionTypes/backendStatus';

const loadBackendStatus = (experimentId) => async (dispatch) => {
  dispatch({
    type: BACKEND_STATUS_LOADING,
    payload: {
      experimentId,
    },
  });

  const url = `/v1/experiments/${experimentId}/backendStatus`;
  try {
    const response = await fetchAPI(url);
    const status = await response.json();

    throwIfRequestFailed(response, status, endUserMessages.ERROR_FETCHING_STATUS);

    dispatch({
      type: BACKEND_STATUS_LOADED,
      payload: {
        experimentId,
        status,
      },
    });

    return status;
  } catch (e) {
    if (!isServerError(e)) {
      console.error(`fetch ${url} error ${e.message}`);
    }
    dispatch({
      type: BACKEND_STATUS_ERROR,
      payload: {
        experimentId,
        error: `Could not get the status of the backend. ${e}`,
      },
    });
  }
};

export default loadBackendStatus;
