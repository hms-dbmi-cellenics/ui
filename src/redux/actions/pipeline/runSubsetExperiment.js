import fetchAPI from 'utils/http/fetchAPI';
import handleError from 'utils/http/handleError';
import endUserMessages from 'utils/endUserMessages';

import loadBackendStatus from 'redux/actions/backendStatus/loadBackendStatus';

const runSubsetExperiment = (experimentId, name, cellSetKeys) => async (dispatch) => {
  try {
    await fetchAPI(
      `/v2/experiments/${experimentId}/subset`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          cellSetKeys,
        }),
      },
    );
  } catch (e) {
    const errorMessage = handleError(e, endUserMessages.ERROR_STARTING_PIPLELINE);

    if (errorMessage !== endUserMessages.ERROR_NO_PERMISSIONS) {
      await dispatch(loadBackendStatus(experimentId));
    }
  }
};

export default runSubsetExperiment;
