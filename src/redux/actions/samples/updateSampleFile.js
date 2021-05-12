import moment from 'moment';
import saveSamples from './saveSamples';

import {
  SAMPLES_FILE_UPDATE,
} from '../../actionTypes/samples';
import pushNotificationMessage from '../notifications';
import errorTypes from './errorTypes';

const updateSampleFile = (
  sampleUuid,
  file,
) => async (dispatch, getState) => {
  const updatedAt = moment().toISOString();
  const sample = getState().samples[sampleUuid];

  try {
    dispatch(saveSamples(sample.projectUuid));

    dispatch({
      type: SAMPLES_FILE_UPDATE,
      payload: {
        sampleUuid,
        lastModified: updatedAt,
        file,
      },
    });
  } catch (e) {
    pushNotificationMessage('error', errorTypes.SAVE_SAMPLES);
  }
};

export default updateSampleFile;
