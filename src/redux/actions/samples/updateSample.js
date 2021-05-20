import moment from 'moment';
import _ from 'lodash';

import saveSamples from './saveSamples';

import {
  SAMPLES_UPDATE,
} from '../../actionTypes/samples';
import pushNotificationMessage from '../notifications';
import errorTypes from './errorTypes';

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
    dispatch(saveSamples(sample.projectUuid, newSample));

    dispatch({
      type: SAMPLES_UPDATE,
      payload: {
        sampleUuid,
        diff,
      },
    });
  } catch (e) {
    pushNotificationMessage('error', errorTypes.SAVE_SAMPLES);
  }
};

export default updateSample;
