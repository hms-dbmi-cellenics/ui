import pipelineStatusValues from 'utils/pipelineStatusValues';
import fetchAPI from '../../../utils/fetchAPI';
import { isServerError, throwIfRequestFailed } from '../../../utils/fetchErrors';
import endUserMessages from '../../../utils/endUserMessages';
import {
  EXPERIMENT_SETTINGS_PIPELINE_START,
  EXPERIMENT_SETTINGS_INFO_UPDATE,
} from '../../actionTypes/experimentSettings';

import {
  BACKEND_STATUS_LOADING,
  BACKEND_STATUS_ERROR,
} from '../../actionTypes/backendStatus';
import loadBackendStatus from '../backendStatus/loadBackendStatus';

const runGem2s = (experimentId) => async (dispatch, getState) => {
  const { experiments, backendStatus } = getState();

  const projectId = experiments[experimentId].projectUuid;

  dispatch({
    type: BACKEND_STATUS_LOADING,
    payload: {
      experimentId,
    },
  });

  const gem2sShouldRun = () => {
    const { RUNNING, NOT_CREATED, SUCCEEDED } = pipelineStatusValues;
    console.log('backend status isssss ', backendStatus);
    const { status: gem2sStatus } = backendStatus[experimentId].status.gem2s || false;
    console.log('WE NEDE TO RUN GEM2S ', gem2sStatus);
    if (![RUNNING, SUCCEEDED].includes(gem2sStatus) || NOT_CREATED === gem2sStatus) {
      return true;
    }
  };
  const url = `/v1/experiments/${experimentId}/gem2s`;
  if (gem2sShouldRun()) {
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
  }
};

export default runGem2s;
