import endUserMessages from 'utils/endUserMessages';

import {
  SAMPLES_BULK_OPTIONS_UPDATE, SAMPLES_SAVING, SAMPLES_SAVED, SAMPLES_ERROR,
} from 'redux/actionTypes/samples';

import handleError from 'utils/http/handleError';
// import fetchAPI from 'utils/http/fetchAPI';

const bulkUpdateSampleOptions = (experimentId, sampleUuids, diff) => async (dispatch) => {
  // const url = `/v2/experiments/${experimentId}/samples/bulk/options`;
  // const body = diff;

  dispatch({
    type: SAMPLES_SAVING,
    payload: {
      message: endUserMessages.SAVING_SAMPLE,
    },
  });

  try {
    // await fetchAPI(
    //   url,
    //   {
    //     method: 'PATCH',
    //     headers: {
    //       'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify(body),
    //   },
    // );

    dispatch({
      type: SAMPLES_SAVED,
    });

    dispatch({
      type: SAMPLES_BULK_OPTIONS_UPDATE,
      payload: {
        sampleUuids,
        diff,
      },
    });
  } catch (e) {
    const errorMessage = handleError(e, endUserMessages.ERROR_SAVING);

    dispatch({
      type: SAMPLES_ERROR,
      payload: {
        error: errorMessage,
      },
    });
  }
};

export default bulkUpdateSampleOptions;
