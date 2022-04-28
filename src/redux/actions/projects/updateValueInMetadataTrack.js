import {
  SAMPLES_ERROR,
  SAMPLES_SAVING,
  SAMPLES_VALUE_IN_METADATA_TRACK_UPDATED,
} from 'redux/actionTypes/samples';

import fetchAPI from 'utils/http/fetchAPI';
import handleError from 'utils/http/handleError';

import endUserMessages from 'utils/endUserMessages';

import config from 'config';
import { api } from 'utils/constants';

const updateValueInMetadataTrack = (
  experimentId, sampleId, metadataTrackKey, value,
) => async (dispatch) => {
  if (config.currentApiVersion !== api.V2) {
    throw new Error('This action only works with api v2');
  }

  dispatch({ type: SAMPLES_SAVING, payload: { message: endUserMessages.SAVING_SAMPLE } });

  try {
    const body = { value };

    await fetchAPI(
      `/v2/experiments/${experimentId}/samples/${sampleId}/metadataTracks/${metadataTrackKey}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
    );

    dispatch({
      type: SAMPLES_VALUE_IN_METADATA_TRACK_UPDATED,
      payload: {
        sampleUuid: sampleId,
        key: metadataTrackKey,
        value,
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

export default updateValueInMetadataTrack;
