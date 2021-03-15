import {
  EXPERIMENT_SETTINGS_PIPELINE_STATUS_LOADING,
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
    const response = await fetch(
      `${getApiEndpoint()}/v1/experiments/${experimentId}/pipelines`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    // dispatch({
    //   type: EXPERIMENT_SETTINGS_PIPELINE_STATUS_ERROR,
    //   payload: {
    //     error: 'Could not start the pipeline.',
    //     errorType: e,
    //   },
    // });
  }
};

export default runPipeline;
