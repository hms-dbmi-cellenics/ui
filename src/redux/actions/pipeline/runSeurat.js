import fetchAPI from 'utils/http/fetchAPI';
import handleError from 'utils/http/handleError';
import endUserMessages from 'utils/endUserMessages';

import {
  BACKEND_STATUS_LOADING,
  BACKEND_STATUS_ERROR,
} from 'redux/actionTypes/backendStatus';

import loadBackendStatus from 'redux/actions/backendStatus/loadBackendStatus';

const runSeurat = (experimentId, paramsHash) => async (dispatch) => {
  dispatch({
    type: BACKEND_STATUS_LOADING,
    payload: {
      experimentId,
    },
  });

  try {
    await fetchAPI(
      `/v2/experiments/${experimentId}/seurat`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paramsHash }),
      },
    );

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

export default runSeurat;
