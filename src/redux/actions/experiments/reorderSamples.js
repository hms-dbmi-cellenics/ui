import fetchAPI from 'utils/http/fetchAPI';
import {
  EXPERIMENTS_UPDATED, EXPERIMENTS_SAVING, EXPERIMENTS_ERROR,
} from 'redux/actionTypes/experiments';

import pushNotificationMessage from 'utils/pushNotificationMessage';
import handleError from 'utils/http/handleError';

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

    await fetchAPI(
      url,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
    );

    dispatch({
      type: EXPERIMENTS_UPDATED,
      payload: {
        experimentId,
        experiment: { sampleIds: newSampleOrder },
      },
    });
  } catch (e) {
    const errorMessage = handleError(e);

    dispatch({
      type: EXPERIMENTS_ERROR,
      payload: {
        error: errorMessage,
      },
    });

    pushNotificationMessage(
      'error',
      errorMessage,
    );
  }
};

export default reorderSamples;
