import pipelineStatus from '../../../utils/pipelineStatusValues';
import fetchAPI from '../../../utils/fetchAPI';
import { isServerError, throwIfRequestFailed } from '../../../utils/fetchErrors';
import endUserMessages from '../../../utils/endUserMessages';
import {
  EXPERIMENT_SETTINGS_PIPELINE_START,
  EXPERIMENT_SETTINGS_INFO_UPDATE,
} from '../../actionTypes/experimentSettings';

import {
  BACKEND_STATUS_ERROR, BACKEND_STATUS_LOADED,
} from '../../actionTypes/backendStatus';

const runGem2s = (experimentId) => async (dispatch, getState) => {
  const { experiments, backendStatus } = getState();

  const runningStatus = {
    ...backendStatus[experimentId].status,
    gem2s: {
      status: pipelineStatus.RUNNING,
      completedSteps: [],
    },
  };
  dispatch({
    type: BACKEND_STATUS_LOADED,
    payload: {
      experimentId,
      status: runningStatus,
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

    const projectId = experiments[experimentId].projectUuid;

    dispatch({
      type: EXPERIMENT_SETTINGS_INFO_UPDATE,
      payload: {
        experimentId,
        experimentName: experiments[experimentId].name,
        projectId,
        sampleIds: experiments[experimentId].sampleIds,
      },
    });
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
