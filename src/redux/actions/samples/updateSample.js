import moment from 'moment';
import _ from 'lodash';

import saveSamples from './saveSamples';

import {
  SAMPLES_UPDATE,
} from '../../actionTypes/samples';
import endUserMessages from '../../../utils/endUserMessages';
import pushNotificationMessage from '../../../utils/pushNotificationMessage';

import mergeObjectWithArrays from '../../../utils/mergeObjectWithArrays';

const updateSample = (
  sampleUuid,
  diff,
) => async (dispatch, getState) => {
  const sample = _.cloneDeep(getState().samples[sampleUuid]);

  // eslint-disable-next-line no-param-reassign
  diff.lastModified = moment().toISOString();

  const newSample = mergeObjectWithArrays(sample, diff);

  try {
    dispatch(saveSamples(sample.projectUuid, newSample))
      .then(() => dispatch({
        type: SAMPLES_UPDATE,
        payload: {
          sampleUuid,
          sample: diff,
        },
      }));
  } catch (e) {
    pushNotificationMessage('error', endUserMessages.ERROR_SAVING);
  }
};

export default updateSample;
