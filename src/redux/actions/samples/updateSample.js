import _ from 'lodash';

import endUserMessages from 'utils/endUserMessages';

import {
  SAMPLES_UPDATE, SAMPLES_SAVING, SAMPLES_SAVED, SAMPLES_ERROR,
} from 'redux/actionTypes/samples';

import handleError from 'utils/http/handleError';
import fetchAPI from 'utils/http/fetchAPI';
import { loadBackendStatus } from '../backendStatus';

const updateSample = (sampleUuid, diff) => async (dispatch, getState) => {
  // In api v2 experimentId and experimentId are the same
  const { experimentId } = getState().samples[sampleUuid];

  if (_.isNil(diff.name) || diff.option || diff.metadata) {
    throw new Error('This action can be used to update only the name in sample');
  }

  const url = `/v2/experiments/${experimentId}/samples/${sampleUuid}`;
  const body = diff;

  dispatch({
    type: SAMPLES_SAVING,
    payload: {
      message: endUserMessages.SAVING_SAMPLE,
    },
  });

  try {
    await fetchAPI(
      url,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
    );

    dispatch({
      type: SAMPLES_SAVED,
    });

    dispatch({
      type: SAMPLES_UPDATE,
      payload: {
        sampleUuid,
        sample: diff,
      },
    });

    await dispatch(loadBackendStatus(experimentId));
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

export default updateSample;
