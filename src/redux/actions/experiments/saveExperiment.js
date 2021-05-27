/* eslint-disable no-param-reassign */
import fetchAPI from '../../../utils/fetchAPI';
import pushNotificationMessage from '../../../utils/pushNotificationMessage';
import {
  EXPERIMENTS_ERROR,
  EXPERIMENTS_SAVING,
  EXPERIMENTS_SAVED,
} from '../../actionTypes/experiments';
import errorTypes from './errorTypes';

const saveExperiment = (
  experimentId,
  newExperiment,
  alreadyExists = true,
) => async (dispatch, getState) => {
  const payload = newExperiment || getState().experiments[experimentId];

  dispatch({
    type: EXPERIMENTS_SAVING,
  });

  try {
    const response = await fetchAPI(
      `/v1/experiments/${experimentId}`,
      {
        method: alreadyExists ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      throw new Error('HTTP status code was not 200.');
    }

    dispatch({
      type: EXPERIMENTS_SAVED,
    });
  } catch (e) {
    dispatch({
      type: EXPERIMENTS_ERROR,
      payload: {
        error: errorTypes.SAVE_EXPERIMENT,
      },
    });

    pushNotificationMessage(
      'error',
      'We couldn\'t connect to the server to save your current experiment, retrying...',
    );
  }
};

export default saveExperiment;
