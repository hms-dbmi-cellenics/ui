import moment from 'moment';
import saveSamples from './saveSamples';

import {
  SAMPLES_FILE_UPDATE,
} from '../../actionTypes/samples';
import pushNotificationMessage from '../notifications';
import errorTypes from './errorTypes';
import mergeObjectWithArrays from '../../../utils/mergeObjectWithArrays';

const updateSampleFile = (
  sampleUuid,
  fileName,
  fileDiff,
) => async (dispatch, getState) => {
  const updatedAt = moment().toISOString();
  const sample = getState().samples[sampleUuid];

  const diffObject = {
    fileNames: sample.fileNames.add(fileName),
    files: {
      [fileName]: {
        ...sample.files[fileName],
        fileDiff,
      },
    },
  };

  const newSample = mergeObjectWithArrays(sample, diffObject);

  try {
    dispatch(saveSamples(sample.projectUuid, newSample));

    dispatch({
      type: SAMPLES_FILE_UPDATE,
      payload: {
        sampleUuid,
        lastModified: updatedAt,
        fileName,
        fileDiff,
      },
    });
  } catch (e) {
    pushNotificationMessage('error', errorTypes.SAVE_SAMPLES);
  }
};

export default updateSampleFile;
