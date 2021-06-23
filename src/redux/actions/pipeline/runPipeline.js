import _ from 'lodash';
import fetchAPI from '../../../utils/fetchAPI';
import { isServerError, throwIfRequestFailed } from '../../../utils/fetchErrors';
import endUserMessages from '../../../utils/endUserMessages';
import {
  EXPERIMENT_SETTINGS_BACKEND_STATUS_LOADING,
  EXPERIMENT_SETTINGS_BACKEND_STATUS_ERROR,
  EXPERIMENT_SETTINGS_PIPELINE_START,
} from '../../actionTypes/experimentSettings';
import loadBackendStatus from '../experimentSettings/loadBackendStatus';

const runPipeline = (experimentId, callerStepKeys) => async (dispatch, getState) => {
  dispatch({
    type: EXPERIMENT_SETTINGS_BACKEND_STATUS_LOADING,
    payload: {
      experimentId,
    },
  });

  if (!_.isArray(callerStepKeys)) {
    // eslint-disable-next-line no-param-reassign
    callerStepKeys = [callerStepKeys];
  }
  const processingConfig = callerStepKeys.map((key) => {
    const currentConfig = getState().experimentSettings.processing[key];
    return {
      name: key,
      body: currentConfig,
    };
  });
  const url = `/v1/experiments/${experimentId}/pipelines`;
  try {
    // We are only sending the configuration that we know changed
    // with respect to the one that is already persisted in dynamodb
    // The api will then merge this with the full config saved in dynamodb to get an updated version

    // We don't need to manually save any processing config because it is done by
    // the api once the pipeline finishes successfully
    const response = await fetchAPI(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          processingConfig,
        }),
      },
    );
    const json = await response.json();
    throwIfRequestFailed(response, json, endUserMessages.ERROR_STARTING_PIPLELINE);
    dispatch({
      type: EXPERIMENT_SETTINGS_PIPELINE_START,
      payload: {},
    });
    dispatch(loadBackendStatus(experimentId));
  } catch (e) {
    let { message } = e;
    if (!isServerError(e)) {
      console.error(`fetch ${url} error ${message}`);
      message = endUserMessages.CONNECTION_ERROR;
    }
    dispatch({
      type: EXPERIMENT_SETTINGS_BACKEND_STATUS_ERROR,
      payload: {
        error: 'Could not start the pipeline.',
        errorType: message,
      },
    });
  }
};

export default runPipeline;
