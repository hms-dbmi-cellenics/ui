import fetchAPI from 'utils/fetchAPI';
import {
  EXPERIMENTS_UPDATED, EXPERIMENTS_SAVING, EXPERIMENTS_ERROR,
} from 'redux/actionTypes/experiments';
import endUserMessages from 'utils/endUserMessages';
import pushNotificationMessage from 'utils/pushNotificationMessage';
import { isServerError, throwIfRequestFailed } from 'utils/fetchErrors';

const reorderSamples = (
  experimentId,
  oldIndex,
  newIndex,
  newSampleOrder,
) => async (dispatch) => {
  dispatch({
    type: EXPERIMENTS_SAVING,
  });

  let url;

  try {
    url = `/v2/experiments/${experimentId}/samples/position`;

    const body = {
      oldPosition: oldIndex,
      newPosition: newIndex,
    };

    const response = await fetchAPI(
      url,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
    );

    const json = await response.json();
    throwIfRequestFailed(response, json, endUserMessages.ERROR_SAVING);

    dispatch({
      type: EXPERIMENTS_UPDATED,
      payload: {
        experimentId,
        experiment: { sampleIds: newSampleOrder },
      },
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

export default reorderSamples;
