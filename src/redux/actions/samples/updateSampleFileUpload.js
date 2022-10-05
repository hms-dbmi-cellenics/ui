import moment from 'moment';

import { SAMPLES_FILE_UPDATE } from 'redux/actionTypes/samples';
import endUserMessages from 'utils/endUserMessages';
import fetchAPI from 'utils/http/fetchAPI';
import handleError from 'utils/http/handleError';
import UploadStatus from 'utils/upload/UploadStatus';
import fileNameForApiV1 from 'utils/upload/fileNameForApiV1';

const updateSampleFileUpload = (
  experimentId, sampleId, type, uploadStatus, uploadProgress,
) => async (dispatch) => {
  const updatedAt = moment().toISOString();

  // Don't send an api update whenever the progress bar is updated, only for uploadStatus changes
  // TODO: move progress to not even be a part of redux, manage it in a different way
  if (uploadStatus !== UploadStatus.UPLOADING) {
    const url = `/v2/experiments/${experimentId}/samples/${sampleId}/sampleFiles/${type}`;
    const body = { uploadStatus };

    try {
      await fetchAPI(
        url,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        },
      );
    } catch (e) {
      dispatch({
        type: SAMPLES_FILE_UPDATE,
        payload: {
          sampleUuid: sampleId,
          lastModified: updatedAt,
          fileName: fileNameForApiV1[type],
          fileDiff: { upload: { status: UploadStatus.UPLOAD_ERROR } },
        },
      });

      handleError(e, endUserMessages.ERROR_UPDATE_SERVER_ON_UPLOAD_STATE);

      return;
    }
  }

  dispatch({
    type: SAMPLES_FILE_UPDATE,
    payload: {
      sampleUuid: sampleId,
      lastModified: updatedAt,
      fileName: fileNameForApiV1[type],
      fileDiff: { upload: { status: uploadStatus, progress: uploadProgress } },
    },
  });
};

export default updateSampleFileUpload;
