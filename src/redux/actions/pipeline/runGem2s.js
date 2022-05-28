import fetchAPI from 'utils/http/fetchAPI';
import handleError from 'utils/http/handleError';
import endUserMessages from 'utils/endUserMessages';
import {
  EXPERIMENT_SETTINGS_PIPELINE_START,
} from 'redux/actionTypes/experimentSettings';

import {
  BACKEND_STATUS_LOADING,
  BACKEND_STATUS_ERROR,
} from 'redux/actionTypes/backendStatus';

import loadBackendStatus from 'redux/actions/backendStatus/loadBackendStatus';

import config from 'config';
import { api } from 'utils/constants';

const runGem2s = (experimentId, paramsHash) => async (dispatch) => {
  dispatch({
    type: BACKEND_STATUS_LOADING,
    payload: {
      experimentId,
    },
  });

  let url;
  if (config.currentApiVersion === api.V1) {
    url = `/v1/experiments/${experimentId}/gem2s`;
  } else if (config.currentApiVersion === api.V2) {
    url = `/v2/experiments/${experimentId}/gem2s`;
  }

  try {
    await fetchAPI(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paramsHash }),
      },
    );

    dispatch({
      type: EXPERIMENT_SETTINGS_PIPELINE_START,
      payload: {},
    });

    dispatch(loadBackendStatus(experimentId));
  } catch (e) {
    let errorMessage = handleError(e, endUserMessages.ERROR_STARTING_PIPLELINE);

    // temporarily give the user more info if the error is permission denied
    if (errorMessage.includes('does not have access to experiment')) {
      errorMessage += ' Refresh the page to continue with your analysis.';
    }

    dispatch({
      type: BACKEND_STATUS_ERROR,
      payload: {
        experimentId,
        error: errorMessage,
      },
    });
  }
};

export default runGem2s;
