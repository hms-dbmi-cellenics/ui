/* eslint-disable no-param-reassign */
import fetchAPI from 'utils/http/fetchAPI';
import dayjs from 'dayjs';

import { v4 as uuidv4 } from 'uuid';
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
  const createdAt = dayjs().toISOString();
  const experimentId = uuidv4();

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
        // TODO We don't really need to send this createdAt to redux, the real createdAt
        // is being generated in the api
        // We should make the POST to create the experiment return the new experiment and
        // Take the createdAt from there
        experiment: { createdAt, ...newExperimentProperties },
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
  }

  return Promise.resolve(experimentId);
};

export default createExperiment;
