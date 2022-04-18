import handleError from 'utils/http/handleError';
import fetchAPI from 'utils/http/fetchAPI';
import {
  BACKEND_STATUS_LOADING,
  BACKEND_STATUS_LOADED,
  BACKEND_STATUS_ERROR,
} from 'redux/actionTypes/backendStatus';

import config from 'config';
import { api } from 'utils/constants';
import endUserMessages from 'utils/endUserMessages';

const loadBackendStatus = (experimentId) => async (dispatch) => {
  dispatch({
    type: BACKEND_STATUS_LOADING,
    payload: {
      experimentId,
    },
  });

  let url;

  if (config.currentApiVersion === api.V1) {
    url = `/v1/experiments/${experimentId}/backendStatus`;
  } else if (config.currentApiVersion === api.V2) {
    url = `/v2/experiments/${experimentId}/backendStatus`;
  }

  try {
    const status = await fetchAPI(url);

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
