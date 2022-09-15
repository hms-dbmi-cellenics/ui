import fetchAPI from 'utils/http/fetchAPI';
import handleError from 'utils/http/handleError';
import endUserMessages from 'utils/endUserMessages';
import {
  EXPERIMENT_SETTINGS_QC_START,
} from 'redux/actionTypes/experimentSettings';

import loadBackendStatus from 'redux/actions/backendStatus/loadBackendStatus';

const runGem2s = (experimentId, paramsHash) => async (dispatch, getState) => {
  const paramsHashToSend = paramsHash
    ?? getState().backendStatus[experimentId].status.gem2s.paramsHash;

  try {
    await fetchAPI(
      `/v2/experiments/${experimentId}/gem2s`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paramsHash: paramsHashToSend }),
      },
    );

    dispatch({
      type: EXPERIMENT_SETTINGS_QC_START,
      payload: {},
    });

    await dispatch(loadBackendStatus(experimentId));
  } catch (e) {
    const errorMessage = handleError(e, endUserMessages.ERROR_STARTING_PIPLELINE);

    if (errorMessage !== endUserMessages.ERROR_NO_PERMISSIONS) {
      await dispatch(loadBackendStatus(experimentId));
    }
  }
};

export default runGem2s;
