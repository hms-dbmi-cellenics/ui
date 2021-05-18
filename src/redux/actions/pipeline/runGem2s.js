import fetchAPI from '../../../utils/fetchAPI';
import {
  EXPERIMENT_SETTINGS_PIPELINE_STATUS_LOADING,
  EXPERIMENT_SETTINGS_PIPELINE_STATUS_ERROR,
  EXPERIMENT_SETTINGS_PIPELINE_START,
  EXPERIMENT_SETTINGS_INFO_UPDATE,
} from '../../actionTypes/experimentSettings';
import loadPipelineStatus from '../experimentSettings/loadPipelineStatus';

const runGem2s = (experimentId) => async (dispatch, getState) => {
  const { experiments } = getState();

  dispatch({
    type: EXPERIMENT_SETTINGS_PIPELINE_STATUS_LOADING,
    payload: {
      experimentId,
    },
  });

  try {
    const response = await fetchAPI(
      `/v1/experiments/${experimentId}/gem2s`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    if (response.ok) {
      dispatch({
        type: EXPERIMENT_SETTINGS_PIPELINE_START,
        payload: {},
      });

      dispatch(loadPipelineStatus(experimentId));

      dispatch({
        type: EXPERIMENT_SETTINGS_INFO_UPDATE,
        payload: {
          experimentId,
          experimentName: experiments[experimentId].name,
          projectUuid: experiments[experimentId].projectUuid,
        },
      });

      return;
    }

    throw new Error('HTTP status code was not 200.');
  } catch (e) {
    dispatch({
      type: EXPERIMENT_SETTINGS_PIPELINE_STATUS_ERROR,
      payload: {
        error: 'Could not start gem2s.',
        errorType: e,
      },
    });
  }
};

export default runGem2s;
