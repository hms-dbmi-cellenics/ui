import moment from 'moment';
import saveSamples from './saveSamples';

import {
  SAMPLES_UPDATE,
} from '../../actionTypes/samples';
import pushNotificationMessage from '../notifications';
import errorTypes from './errorTypes';

const updateSample = (
  sampleUuid,
  sample,
) => async (dispatch, getState) => {
  const currentSampleState = getState().samples;

  // eslint-disable-next-line no-param-reassign
  sample.lastModified = moment().toISOString();

  try {
    dispatch({
      type: SAMPLES_UPDATE,
      payload: {
        sampleUuid,
        sample,
      },
    });

    dispatch(saveSamples(currentSampleState[sampleUuid].projectUuid));
  } catch (e) {
    pushNotificationMessage('error', errorTypes.SAVE_SAMPLES);
  }
};

export default updateSample;
