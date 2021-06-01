import fetchAPI from '../../../utils/fetchAPI';
import { isServerError, throwWithEndUserMessage } from '../../../utils/fetchErrors';
import endUserMessages from '../../../utils/endUserMessages';
import {
  EXPERIMENT_SETTINGS_BACKEND_STATUS_LOADING,
  EXPERIMENT_SETTINGS_BACKEND_STATUS_ERROR,
  EXPERIMENT_SETTINGS_PIPELINE_START,
} from '../../actionTypes/experimentSettings';
import loadBackendStatus from '../experimentSettings/loadBackendStatus';

const runPipeline = (experimentId, callerStepKey) => async (dispatch, getState) => {
  dispatch({
    type: EXPERIMENT_SETTINGS_BACKEND_STATUS_LOADING,
    payload: {
      experimentId,
    },
  });

  const processingConfig = getState().experimentSettings.processing[callerStepKey];

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
          processingConfig: [
            {
              name: callerStepKey,
              body: processingConfig,
            },
          ],
        }),
      },
    );
    const json = await response.json();
    throwWithEndUserMessage(response, json, endUserMessages.errorStartingPipeline);

    dispatch({
      type: EXPERIMENT_SETTINGS_PIPELINE_START,
      payload: {},
    });
    await dispatch(loadBackendStatus(experimentId));
  } catch (e) {
    let { message } = e;
    if (!isServerError(e)) {
      console.error(`fetch ${url} error ${message}`);
      message = endUserMessages.connectionError;
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
