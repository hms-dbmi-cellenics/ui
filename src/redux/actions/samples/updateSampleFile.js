import moment from 'moment';
import saveSamples from './saveSamples';

import {
  SAMPLES_FILE_UPDATE, SAMPLES_RESTORE,
} from '../../actionTypes/samples';
import pushNotificationMessage from '../notifications';
import errorTypes from './errorTypes';

const updateSampleFile = (
  sampleUuid,
  file,
) => async (dispatch, getState) => {
  const currentSampleState = getState().samples;
  const updatedAt = moment().toISOString();

  const { projectUuid } = getState().samples[sampleUuid];

  try {
    dispatch({
      type: SAMPLES_FILE_UPDATE,
      payload: {
        sampleUuid,
        lastModified: updatedAt,
        file,
      },
    });

    dispatch(saveSamples(projectUuid));
  } catch (e) {
    pushNotificationMessage('error', errorTypes.SAVE_SAMPLES);

    dispatch({
      type: SAMPLES_RESTORE,
      state: currentSampleState,
    });
  }
};

export default updateSampleFile;
