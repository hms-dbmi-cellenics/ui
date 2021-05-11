import moment from 'moment';
import saveSamples from './saveSamples';

import {
  SAMPLES_RESTORE,
  SAMPLES_UPDATE,
} from '../../actionTypes/samples';
import pushNotificationMessage from '../notifications';
import errorTypes from './errorTypes';

const updateSample = (
  sampleUuid,
  diff,
) => async (dispatch, getState) => {
  const currentSampleState = getState().samples;

  // eslint-disable-next-line no-param-reassign
  diff.lastModified = moment().toISOString();

  try {
    dispatch({
      type: SAMPLES_UPDATE,
      payload: {
        sampleUuid,
        diff,
      },
    });

    dispatch(saveSamples(currentSampleState[sampleUuid].projectUuid));
  } catch (e) {
    pushNotificationMessage('error', errorTypes.SAVE_SAMPLES);

    dispatch({
      type: SAMPLES_RESTORE,
      state: currentSampleState,
    });
  }
};

export default updateSample;
