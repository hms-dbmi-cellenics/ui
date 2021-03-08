import {
  EXPERIMENT_SETTINGS_PIPELINE_STATUS_LOADING,
  EXPERIMENT_SETTINGS_PIPELINE_STATUS_LOADED,
  EXPERIMENT_SETTINGS_PIPELINE_STATUS_ERROR,
} from '../../actionTypes/experimentSettings';

import getApiEndpoint from '../../../utils/apiEndpoint';

const loadPipelineStatus = (experimentId) => async (dispatch) => {
  dispatch({
    type: EXPERIMENT_SETTINGS_PIPELINE_STATUS_LOADING,
    payload: {
      experimentId,
    },
  });

  try {
    const response = await fetch(
      `${getApiEndpoint()}/v1/experiments/${experimentId}/pipelines`,
    );

    if (response.ok) {
      const status = await response.json();

      dispatch({
        type: EXPERIMENT_SETTINGS_PIPELINE_STATUS_LOADED,
        payload: {
          experimentId,
          status,
        },
      });

      return;
    }

    throw new Error('HTTP status code was not 200.');
  } catch (e) {
    dispatch({
      type: EXPERIMENT_SETTINGS_PIPELINE_STATUS_ERROR,
      payload: {
        error: 'Could not get the status of the pipeline.',
        errorType: e,
      },
    });
  }
};

export default loadPipelineStatus;
