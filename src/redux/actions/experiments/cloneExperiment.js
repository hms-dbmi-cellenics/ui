/* eslint-disable no-param-reassign */
import fetchAPI from 'utils/http/fetchAPI';

import {
  EXPERIMENTS_ERROR,
  EXPERIMENTS_SAVING,
  EXPERIMENTS_SAVED,
} from 'redux/actionTypes/experiments';

import endUserMessages from 'utils/endUserMessages';

import handleError from 'utils/http/handleError';
import httpStatusCodes from 'utils/http/httpStatusCodes';

const cloneExperiment = (
  originalId, name = null,
) => async (dispatch) => {
  dispatch({
    type: EXPERIMENTS_SAVING,
  });

  try {
    const newExperimentId = await fetchAPI(`/v2/experiments/${originalId}/clone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });

    dispatch({
      type: EXPERIMENTS_SAVED,
    });

    return newExperimentId;
  } catch (e) {
    const message = e.statusCode === httpStatusCodes.LOCKED
      ? endUserMessages.ERROR_CLONING_PIPELINE_LOCKED
      : endUserMessages.ERROR_CLONING_DEFAULT;

    const errorMessage = handleError(e, message);

    dispatch({
      type: EXPERIMENTS_ERROR,
      payload: {
        error: errorMessage,
      },
    });

    return originalId;
  }
};

export default cloneExperiment;
