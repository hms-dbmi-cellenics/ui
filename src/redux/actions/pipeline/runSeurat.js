import fetchAPI from 'utils/http/fetchAPI';
import handleError from 'utils/http/handleError';
import endUserMessages from 'utils/endUserMessages';
import loadBackendStatus from 'redux/actions/backendStatus/loadBackendStatus';

const runSeurat = (experimentId) => async (dispatch) => {
  try {
    await fetchAPI(
      `/v2/experiments/${experimentId}/seurat`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    await dispatch(loadBackendStatus(experimentId));

    return true;
  } catch (e) {
    const errorMessage = handleError(e, endUserMessages.ERROR_STARTING_PIPLELINE);

    if (errorMessage !== endUserMessages.ERROR_NO_PERMISSIONS) {
      await dispatch(loadBackendStatus(experimentId));
    }

    return false;
  }
};

export default runSeurat;
