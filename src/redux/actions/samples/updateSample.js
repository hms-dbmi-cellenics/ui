import moment from 'moment';
import _ from 'lodash';

import endUserMessages from 'utils/endUserMessages';

import {
  SAMPLES_UPDATE, SAMPLES_SAVING, SAMPLES_SAVED, SAMPLES_ERROR,
} from 'redux/actionTypes/samples';
import saveSamples from 'redux/actions/samples/saveSamples';

import mergeObjectReplacingArrays from 'utils/mergeObjectReplacingArrays';
import handleError from 'utils/http/handleError';
import fetchAPI from 'utils/http/fetchAPI';

import config from 'config';
import { api } from 'utils/constants';

const updateSampleApiV1 = (sampleUuid, diff) => async (dispatch, getState) => {
  const sample = _.cloneDeep(getState().samples[sampleUuid]);

  try {
    // eslint-disable-next-line no-param-reassign
    diff.lastModified = moment().toISOString();

    const newSample = mergeObjectReplacingArrays(sample, diff);

    const notifyUser = false;
    await dispatch(saveSamples(sample.projectUuid, newSample, true, true, notifyUser));

    dispatch({
      type: SAMPLES_UPDATE,
      payload: {
        sampleUuid,
        sample: diff,
      },
    });
  } catch (e) {
    handleError(e, endUserMessages.ERROR_SAVING);
  }
};

const updateSampleApiV2 = (sampleUuid, diff) => async (dispatch, getState) => {
  // In api v2 projectUuid and experimentId are the same
  const experimentId = getState().samples[sampleUuid].projectUuid;

  if (_.isNil(diff.name) || diff.metadata) {
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

const updateSample = (sampleUuid, diff) => {
  if (config.currentApiVersion === api.V1) {
    return updateSampleApiV1(sampleUuid, diff);
  } if (config.currentApiVersion === api.V2) {
    return updateSampleApiV2(sampleUuid, diff);
  }
};

export default updateSample;
