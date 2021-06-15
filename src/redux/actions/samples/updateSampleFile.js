import moment from 'moment';
import saveSamples from './saveSamples';

import {
  SAMPLES_FILE_UPDATE,
} from '../../actionTypes/samples';
import endUserMessages from '../../../utils/endUserMessages';
import pushNotificationMessage from '../../../utils/pushNotificationMessage';
import mergeObjectWithArrays from '../../../utils/mergeObjectWithArrays';
import UploadStatus from '../../../utils/UploadStatus';

const updateSampleFile = (
  sampleUuid,
  fileName,
  fileDiff,
) => async (dispatch, getState) => {
  const updatedAt = moment().toISOString();
  const sample = getState().samples[sampleUuid];
  // we'll need to remove the hard-coded 10x tech type once we start
  // supporting other types and save the chosen tech type in redux
  const { UPLOADED, UPLOAD_ERROR } = UploadStatus;
  try {
    // Save sample only if upload is successful or error
    if ([UPLOADED, UPLOAD_ERROR].includes(fileDiff.upload.status)) {
      const diffObject = {
        files: {
          lastModified: updatedAt,
          [fileName]: {
            ...sample.files[fileName],
            ...fileDiff,
            valid: true,
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
    pushNotificationMessage('error', endUserMessages.ERROR_SAVING);
  }
};

export default updateSampleFile;
