import moment from 'moment';
import _ from 'lodash';

import endUserMessages from 'utils/endUserMessages';

import {
  SAMPLES_UPDATE, SAMPLES_SAVING, SAMPLES_SAVED,
} from 'redux/actionTypes/samples';
import saveSamples from 'redux/actions/samples/saveSamples';

import mergeObjectWithArrays from 'utils/mergeObjectWithArrays';
import handleError from 'utils/http/handleError';
import fetchAPI from 'utils/http/fetchAPI';

import config from 'config';
import { api } from 'utils/constants';

const sendApiV2Request = async (experimentId, sampleId, diff, dispatch) => {
  const url = `/v2/experiments/${experimentId}/samples/${sampleId}`;
  const body = diff;

  dispatch({
    type: SAMPLES_SAVING,
    payload: {
      message: endUserMessages.SAVING_SAMPLE,
    },
  });

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
      sampleId,
      sample: diff,
    },
  });
};

const updateSample = (
  sampleUuid,
  diff,
) => async (dispatch, getState) => {
  const sample = _.cloneDeep(getState().samples[sampleUuid]);

  try {
    if (config.currentApiVersion === api.V1) {
      // eslint-disable-next-line no-param-reassign
      diff.lastModified = moment().toISOString();

      const newSample = mergeObjectWithArrays(sample, diff);

      const notifyUser = false;
      await dispatch(saveSamples(sample.projectUuid, newSample, true, true, notifyUser));
    } else if (config.currentApiVersion === api.V2) {
      if (_.isNil(diff.name) || diff.metadata) {
        throw new Error('This action shouldn\'t be used to update metadata with api v2');
      }

      // in api v2 projectUuid is actually experimentId
      sendApiV2Request(sample.projectUuid, sampleUuid, diff, dispatch);
    }

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

export default updateSample;
