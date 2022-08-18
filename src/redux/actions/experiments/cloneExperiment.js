/* eslint-disable no-param-reassign */
import fetchAPI from 'utils/http/fetchAPI';
import moment from 'moment';

import {
  EXPERIMENTS_CREATED,
  EXPERIMENTS_ERROR,
  EXPERIMENTS_SAVING,
} from 'redux/actionTypes/experiments';

import endUserMessages from 'utils/endUserMessages';

import handleError from 'utils/http/handleError';

const cloneExperiment = (
  originalId, name = null,
) => async (dispatch) => {
  dispatch({
    type: EXPERIMENTS_SAVING,
  });

  try {
    const createdAt = moment().toISOString();

    const newExperimentId = await fetchAPI(`/v2/experiments/${originalId}/clone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });

    dispatch({
      type: EXPERIMENTS_CREATED,
      payload: {
        experiment: { id: newExperimentId, name, createdAt },
      },
    });

    return newExperimentId;
  } catch (e) {
    const errorMessage = handleError(e, endUserMessages.ERROR_SAVING);

    dispatch({
      type: EXPERIMENTS_ERROR,
      payload: {
        error: errorMessage,
      },
    });
  }
};

export default cloneExperiment;
