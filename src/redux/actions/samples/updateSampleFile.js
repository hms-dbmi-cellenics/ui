import moment from 'moment';
import saveSamples from './saveSamples';

import {
  SAMPLES_FILE_UPDATE,
} from '../../actionTypes/samples';
import pushNotificationMessage from '../notifications';
import errorTypes from './errorTypes';
import mergeObjectWithArrays from '../../../utils/mergeObjectWithArrays';
import UploadStatus from '../../../utils/UploadStatus';

const updateSampleFile = (
  sampleUuid,
  fileName,
  fileDiff,
) => async (dispatch, getState) => {
  const updatedAt = moment().toISOString();
  const sample = getState().samples[sampleUuid];

  try {
    // Save sample only if upload is successful or error
    if (fileDiff.upload.status === UploadStatus.UPLOADED
      || fileDiff.upload.status === UploadStatus.UPLOAD_ERROR) {
      const diffObject = {
        fileNames: sample.fileNames.add(fileName),
        files: {
          lastModified: updatedAt,
          [fileName]: {
            ...sample.files[fileName],
            ...fileDiff,
          },
        },
      };

      const newSample = mergeObjectWithArrays(sample, diffObject);
      dispatch(saveSamples(sample.projectUuid, newSample));
    }

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
