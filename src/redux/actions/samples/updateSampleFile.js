import moment from 'moment';

import endUserMessages from 'utils/endUserMessages';
import mergeObjectReplacingArrays from 'utils/mergeObjectReplacingArrays';
import UploadStatus from 'utils/upload/UploadStatus';
import handleError from 'utils/http/handleError';
import {
  SAMPLES_FILE_UPDATE,
} from '../../actionTypes/samples';
import saveSamples from './saveSamples';

const updateSampleFile = (
  sampleUuid,
  fileName,
  fileDiff,
) => async (dispatch, getState) => {
  const updatedAt = moment().toISOString();
  const sample = getState().samples[sampleUuid];
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

      const newSample = mergeObjectReplacingArrays(sample, diffObject);

      const notifyUser = false;
      await dispatch(saveSamples(sample.projectUuid, newSample, true, true, notifyUser));
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
    handleError(e, endUserMessages.ERROR_SAVING);
  }
};

export default updateSampleFile;
