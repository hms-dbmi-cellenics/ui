import fetchAPI from '../../../utils/fetchAPI';
import {
  EXPERIMENT_SETTINGS_BACKEND_STATUS_LOADING,
  EXPERIMENT_SETTINGS_BACKEND_STATUS_LOADED,
  EXPERIMENT_SETTINGS_BACKEND_STATUS_ERROR,
} from '../../actionTypes/experimentSettings';

const loadBackendStatus = (experimentId) => async (dispatch) => {
  dispatch({
    type: EXPERIMENT_SETTINGS_BACKEND_STATUS_LOADING,
    payload: {
      experimentId,
    },
  });

  try {
    const response = await fetchAPI(
      `/v1/experiments/${experimentId}/backendStatus`,
    );

    if (response.ok) {
      const status = await response.json();

      dispatch({
        type: EXPERIMENT_SETTINGS_BACKEND_STATUS_LOADED,
        payload: {
          experimentId,
          status,
        },
      });

      return status;
    }

    throw new Error('HTTP status code was not 200.');
  } catch (e) {
    dispatch({
      type: EXPERIMENT_SETTINGS_BACKEND_STATUS_ERROR,
      payload: {
        error: 'Could not get the status of the backend.',
        errorType: e,
      },
    });
  }
};

export default loadBackendStatus;
