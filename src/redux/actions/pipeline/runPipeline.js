import fetchAPI from '../../../utils/fetchAPI';
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

  try {
    // We are only sending the configuration that we know changed
    // with respect to the one that is already persisted in dynamodb
    // The api will then merge this with the full config saved in dynamodb to get an updated version

    // We don't need to manually save any processing config because it is done by
    // the api once the pipeline finishes successfully
    const response = await fetchAPI(
      `/v1/experiments/${experimentId}/pipelines`,
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

    if (response.ok) {
      dispatch({
        type: EXPERIMENT_SETTINGS_PIPELINE_START,
        payload: {},
      });

      dispatch(loadBackendStatus(experimentId));

      return;
    }

    throw new Error('HTTP status code was not 200.');
  } catch (e) {
    dispatch({
      type: EXPERIMENT_SETTINGS_BACKEND_STATUS_ERROR,
      payload: {
        error: 'Could not start the pipeline.',
        errorType: e,
      },
    });
  }
};

export default runPipeline;
