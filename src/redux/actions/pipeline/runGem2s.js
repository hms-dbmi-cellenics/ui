import fetchAPI from '../../../utils/fetchAPI';
import { isServerError, throwIfRequestFailed } from '../../../utils/fetchErrors';
import endUserMessages from '../../../utils/endUserMessages';
import {
  EXPERIMENT_SETTINGS_PIPELINE_START,
} from '../../actionTypes/experimentSettings';

import {
  BACKEND_STATUS_LOADING,
  BACKEND_STATUS_ERROR,
} from '../../actionTypes/backendStatus';

import loadBackendStatus from '../backendStatus/loadBackendStatus';

const runGem2s = (experimentId, paramsHash) => async (dispatch) => {
  dispatch({
    type: BACKEND_STATUS_LOADING,
    payload: {
      experimentId,
    },
  });

  const url = `/v1/experiments/${experimentId}/gem2s`;
  try {
    const response = await fetchAPI(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paramsHash }),
      },
    );

    const json = await response.json();
    throwIfRequestFailed(response, json, endUserMessages.ERROR_STARTING_PIPLELINE);

    dispatch({
      type: EXPERIMENT_SETTINGS_PIPELINE_START,
      payload: {},
    });

    dispatch(loadBackendStatus(experimentId));
  } catch (e) {
    let { message } = e;
    if (!isServerError(e)) {
      console.error(`fetch ${url} error ${message}`);
      message = endUserMessages.CONNECTION_ERROR;
    }
    dispatch({
      type: BACKEND_STATUS_ERROR,
      payload: {
        error: 'Could not start gem2s.',
        errorType: message,
      },
    });
  }
};

export default runGem2s;
