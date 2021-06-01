/* eslint-disable no-param-reassign */
import fetchAPI from '../../../utils/fetchAPI';
import { isServerError, throwWithEndUserMessage } from '../../../utils/fetchErrors';
import endUserMessages from '../../../utils/endUserMessages';
import pushNotificationMessage from '../../../utils/pushNotificationMessage';
import {
  EXPERIMENTS_ERROR,
  EXPERIMENTS_SAVING,
  EXPERIMENTS_SAVED,
} from '../../actionTypes/experiments';

const saveExperiment = (
  experimentId,
  newExperiment,
  alreadyExists = true,
) => async (dispatch, getState) => {
  const payload = newExperiment || getState().experiments[experimentId];

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
        body: JSON.stringify(payload),
      },
    );

    const json = await response.json();
    throwWithEndUserMessage(response, json, endUserMessages.errorSaving);

    dispatch({
      type: EXPERIMENTS_SAVED,
    });
  } catch (e) {
    let { message } = e;
    if (!isServerError(e)) {
      console.error(`fetch ${url} error ${message}`);
      message = endUserMessages.connectionError;
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
