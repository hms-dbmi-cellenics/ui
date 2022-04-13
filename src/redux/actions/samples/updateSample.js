import moment from 'moment';
import _ from 'lodash';

import endUserMessages from 'utils/endUserMessages';

import mergeObjectWithArrays from 'utils/mergeObjectWithArrays';
import handleError from 'utils/http/handleError';
import {
  SAMPLES_UPDATE,
} from '../../actionTypes/samples';
import saveSamples from './saveSamples';

const updateSample = (
  sampleUuid,
  diff,
) => async (dispatch, getState) => {
  const sample = _.cloneDeep(getState().samples[sampleUuid]);

  // eslint-disable-next-line no-param-reassign
  diff.lastModified = moment().toISOString();

  const newSample = mergeObjectWithArrays(sample, diff);

  try {
    const notifyUser = false;
    await dispatch(saveSamples(sample.projectUuid, newSample, true, true, notifyUser))
      .then(() => dispatch({
        type: SAMPLES_UPDATE,
        payload: {
          sampleUuid,
          sample: diff,
        },
      }));
  } catch (e) {
    handleError(e, endUserMessages.ERROR_SAVING);
  }
};

export default updateSample;
