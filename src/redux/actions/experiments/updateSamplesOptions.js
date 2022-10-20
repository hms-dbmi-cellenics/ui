import endUserMessages from 'utils/endUserMessages';
import _ from 'lodash';

import {
  SAMPLES_OPTIONS_UPDATE, SAMPLES_SAVING, SAMPLES_ERROR,
} from 'redux/actionTypes/samples';

import handleError from 'utils/http/handleError';
import fetchAPI from 'utils/http/fetchAPI';

const updateSamplesOptions = (experimentId, diff) => async (dispatch, getState) => {
  const url = `/v2/experiments/${experimentId}/samples/options`;

  const { sampleIds } = getState().experiments[experimentId];

  // The code assumes that the option of all samples are the same
  // This is the case until we support options at the sample level
  const oldOptions = getState().samples[sampleIds[0]].options;
  const newOptions = _.merge({}, oldOptions, diff);

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
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newOptions),
      },
    );

    dispatch({
      type: SAMPLES_OPTIONS_UPDATE,
      payload: {
        sampleUuids: sampleIds,
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

export default updateSamplesOptions;
