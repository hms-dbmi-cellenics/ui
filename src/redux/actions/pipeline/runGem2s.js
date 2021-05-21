import fetchAPI from '../../../utils/fetchAPI';
import {
  EXPERIMENT_SETTINGS_BACKEND_STATUS_LOADING,
  EXPERIMENT_SETTINGS_BACKEND_STATUS_ERROR,
  EXPERIMENT_SETTINGS_PIPELINE_START,
  EXPERIMENT_SETTINGS_INFO_UPDATE,
} from '../../actionTypes/experimentSettings';
import loadBackendStatus from '../experimentSettings/loadBackendStatus';

const runGem2s = (experimentId) => async (dispatch, getState) => {
  const { experiments } = getState();

  dispatch({
    type: EXPERIMENT_SETTINGS_BACKEND_STATUS_LOADING,
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

    if (!response.ok) {
      throw new Error('HTTP status code was not 200.');
    }

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
        projectUuid: experiments[experimentId].projectUuid,
      },
    });
  } catch (e) {
    dispatch({
      type: EXPERIMENT_SETTINGS_BACKEND_STATUS_ERROR,
      payload: {
        error: 'Could not start gem2s.',
        errorType: e,
      },
    });
  }
};

export default runGem2s;
