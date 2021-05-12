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

  const { projectUuid } = sample[sampleUuid];

  const newSample = {
    ...sample,
    fileNames: new Set([...sample.fileNames, file.name]),
    files: {
      ...sample.files,
      [file.name]: file,
    },
  };

  try {
    dispatch(saveSamples(projectUuid, newSample));

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
