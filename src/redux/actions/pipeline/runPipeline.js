import {
  EXPERIMENT_SETTINGS_PIPELINE_STATUS_LOADING,
  EXPERIMENT_SETTINGS_PIPELINE_STATUS_ERROR,
} from '../../actionTypes/experimentSettings';

import getApiEndpoint from '../../../utils/apiEndpoint';
import loadPipelineStatus from '../experimentSettings/loadPipelineStatus';

const runPipeline = (experimentId, callerStepKey) => async (dispatch, getState) => {
  dispatch({
    type: EXPERIMENT_SETTINGS_PIPELINE_STATUS_LOADING,
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
    const response = await fetch(
      `${getApiEndpoint()}/v1/experiments/${experimentId}/pipelines`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer admin',
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
      dispatch(loadPipelineStatus(experimentId));

      return;
    }

    throw new Error('HTTP status code was not 200.');
  } catch (e) {
    dispatch({
      type: EXPERIMENT_SETTINGS_PIPELINE_STATUS_ERROR,
      payload: {
        error: 'Could not start the pipeline.',
        errorType: e,
      },
    });
  }
};

export default runPipeline;
