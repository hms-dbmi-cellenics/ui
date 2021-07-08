import fetchAPI from '../../../../utils/fetchAPI';
import endUserMessages from '../../../../utils/endUserMessages';
import { isServerError, throwIfRequestFailed } from '../../../../utils/fetchErrors';
import {
  EXPERIMENT_SETTINGS_BACKEND_STATUS_LOADING,
  EXPERIMENT_SETTINGS_BACKEND_STATUS_LOADED,
  EXPERIMENT_SETTINGS_BACKEND_STATUS_ERROR,
} from '../../../actionTypes/experimentSettings';

const loadBackendStatus = (experimentId) => async (dispatch) => {
  dispatch({
    type: EXPERIMENT_SETTINGS_BACKEND_STATUS_LOADING,
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
      type: EXPERIMENT_SETTINGS_BACKEND_STATUS_LOADED,
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
      type: EXPERIMENT_SETTINGS_BACKEND_STATUS_ERROR,
      payload: {
        error: 'Could not get the status of the backend.',
        errorType: e,
      },
    });
  }
};

export default loadBackendStatus;
