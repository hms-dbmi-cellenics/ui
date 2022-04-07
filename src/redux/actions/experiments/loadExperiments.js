import fetchAPI from 'utils/fetchAPI';
import { isServerError, throwIfRequestFailed } from 'utils/fetchErrors';
import endUserMessages from 'utils/endUserMessages';
import pushNotificationMessage from 'utils/pushNotificationMessage';
import {
  EXPERIMENTS_LOADED,
  EXPERIMENTS_ERROR,
  EXPERIMENTS_LOADING,
} from 'redux/actionTypes/experiments';

import config from 'config';
import { api } from 'utils/constants';

const toApiV1 = (experimentV2) => {
  const {
    id,
    name,
    description,
    samplesOrder,
    notifyByEmail,
    processingConfig,
    createdAt,
    pipelines,
  } = experimentV2;

  const experimentV1 = {
    experimentId: id,
    projectId: id,
    description,
    experimentName: name,
    processingConfig,
    createdDate: createdAt,
    notifyByEmail,
    sampleIds: samplesOrder,
    // lastViewed: ignored, it isn\'t being used in the UI,
    meta: {
      // This is always 10x and organism so we can just generate them here
      organism: null,
      type: '10x',
      gem2s: pipelines.gem2s ?? undefined,
      pipeline: pipelines.qc ?? undefined,
    },
  };

  return experimentV1;
};

const loadExperiments = (
  projectUuid,
) => async (dispatch) => {
  dispatch({
    type: EXPERIMENTS_LOADING,
  });

  let url;
  try {
    let data;

    if (config.currentApiVersion === api.V1) {
      url = `/v1/projects/${projectUuid}/experiments`;
      const response = await fetchAPI(url);
      data = await response.json();

      throwIfRequestFailed(response, data, endUserMessages.ERROR_FETCHING_EXPERIMENTS);
    } else if (config.currentApiVersion === api.V2) {
      url = `/v2/experiments/${projectUuid}`;
      const response = await fetchAPI(url);
      const dataV2 = await response.json();

      throwIfRequestFailed(response, data, endUserMessages.ERROR_FETCHING_EXPERIMENTS);

      data = [toApiV1(dataV2)];
    }

    dispatch({
      type: EXPERIMENTS_LOADED,
      payload: {
        experiments: data,
      },
    });
  } catch (e) {
    let { message } = e;
    if (!isServerError(e)) {
      console.error(`fetch ${url} error ${message}`);
      message = endUserMessages.CONNECTION_ERROR;
    }
    dispatch({
      type: EXPERIMENTS_ERROR,
      payload: {
        error: message,
      },
    });

    pushNotificationMessage('error', message);
  }
};

export default loadExperiments;
