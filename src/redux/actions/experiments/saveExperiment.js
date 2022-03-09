/* eslint-disable no-param-reassign */
import fetchAPI from 'utils/fetchAPI';
import { isServerError, throwIfRequestFailed } from 'utils/fetchErrors';
import endUserMessages from 'utils/endUserMessages';
import pushNotificationMessage from 'utils/pushNotificationMessage';
import {
  EXPERIMENTS_ERROR,
  EXPERIMENTS_SAVING,
  EXPERIMENTS_SAVED,
} from 'redux/actionTypes/experiments';

import experimentConvertedToApiModel from 'utils/convertExperimentToApiModel';

const saveExperiment = (
  experimentId,
  newExperiment,
  alreadyExists = true,
) => async (dispatch, getState) => {
  const experimentToSend = newExperiment || getState().experiments[experimentId];

  dispatch({
    type: EXPERIMENTS_SAVING,
  });

  const url = `/v1/experiments/${experimentId}`;
  try {
    const response = await fetchAPI(
      url,
      {
        method: alreadyExists ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(experimentConvertedToApiModel(experimentToSend)),
      },
    );

    const json = await response.json();
    throwIfRequestFailed(response, json, endUserMessages.ERROR_SAVING);

    dispatch({
      type: EXPERIMENTS_SAVED,
    });
  } catch (e) {
    let { message } = e;
    if (!isServerError(e)) {
      console.error(`fetch ${url} error ${message}`);
      message = endUserMessages.CONNECTION_ERROR;
    }
    dispatch({
      type: EXPERIMENTS_ERROR,
      payload: {
        error: message,
      },
    });

    pushNotificationMessage(
      'error',
      message,
    );
  }
};

export default saveExperiment;
