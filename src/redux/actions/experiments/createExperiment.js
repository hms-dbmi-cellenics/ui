/* eslint-disable no-param-reassign */
import fetchAPI from 'utils/http/fetchAPI';
import moment from 'moment';
import hash from 'object-hash';
import {
  EXPERIMENTS_CREATED,
  EXPERIMENTS_ERROR,
  EXPERIMENTS_SAVING,
} from 'redux/actionTypes/experiments';

import endUserMessages from 'utils/endUserMessages';

import handleError from 'utils/http/handleError';

const createExperiment = (
  name, description,
) => async (dispatch) => {
  const createdDate = moment().toISOString();
  const experimentId = hash.MD5(createdDate);

  const newExperimentProperties = {
    id: experimentId,
    name,
    description,
  };

  dispatch({
    type: EXPERIMENTS_SAVING,
  });

  try {
    await fetchAPI(
      `/v2/experiments/${experimentId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newExperimentProperties),
      },
    );

    dispatch({
      type: EXPERIMENTS_CREATED,
      payload: {
        experiment: { createdDate, ...newExperimentProperties },
      },
    });
  } catch (e) {
    const errorMessage = handleError(e, endUserMessages.ERROR_SAVING);

    dispatch({
      type: EXPERIMENTS_ERROR,
      payload: {
        error: errorMessage,
      },
    });

    throw e;
  }

  return Promise.resolve(experimentId);
};

export default createExperiment;
