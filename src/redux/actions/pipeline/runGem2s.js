import fetchAPI from '../../../utils/fetchAPI';
import { isServerError, throwIfRequestFailed } from '../../../utils/fetchErrors';
import endUserMessages from '../../../utils/endUserMessages';
import {
  EXPERIMENT_SETTINGS_BACKEND_STATUS_LOADING,
  EXPERIMENT_SETTINGS_BACKEND_STATUS_ERROR,
  EXPERIMENT_SETTINGS_PIPELINE_START,
  EXPERIMENT_SETTINGS_INFO_UPDATE,
} from '../../actionTypes/experimentSettings';
import loadBackendStatus from '../experimentSettings/backendStatus/loadBackendStatus';

const runGem2s = (experimentId) => async (dispatch, getState) => {
  const { experiments } = getState();

  dispatch({
    type: EXPERIMENT_SETTINGS_BACKEND_STATUS_LOADING,
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
      },
    );

    const json = await response.json();
    throwIfRequestFailed(response, json, endUserMessages.ERROR_STARTING_PIPLELINE);

    dispatch({
      type: EXPERIMENT_SETTINGS_PIPELINE_START,
      payload: {},
    });

    dispatch(loadBackendStatus(experimentId));

    dispatch({
      type: EXPERIMENT_SETTINGS_INFO_UPDATE,
      payload: {
        experimentId,
        experimentName: experiments[experimentId].name,
        projectUuid: experiments[experimentId].projectUuid,
      },
    });
  } catch (e) {
    let { message } = e;
    if (!isServerError(e)) {
      console.error(`fetch ${url} error ${message}`);
      message = endUserMessages.CONNECTION_ERROR;
    }
    dispatch({
      type: EXPERIMENT_SETTINGS_BACKEND_STATUS_ERROR,
      payload: {
        error: 'Could not start gem2s.',
        errorType: message,
      },
    });
  }
};

export default runGem2s;
