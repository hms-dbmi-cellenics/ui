import dayjs from 'dayjs';

import { SAMPLES_FILE_UPDATE } from 'redux/actionTypes/samples';
import endUserMessages from 'utils/endUserMessages';
import fetchAPI from 'utils/http/fetchAPI';
import handleError from 'utils/http/handleError';
import UploadStatus from 'utils/upload/UploadStatus';

const updateSampleFileUpload = (
  experimentId, sampleId, sampleFileId, type, uploadStatus, uploadProgress,
) => async (dispatch) => {
  const updatedAt = dayjs().toISOString();

  // Don't send an api update whenever the progress bar is updated, only for uploadStatus changes
  // TODO: move progress to not even be a part of redux, manage it in a different way
  if (uploadStatus !== UploadStatus.UPLOADING) {
    const url = `/v2/experiments/${experimentId}/sampleFiles/${sampleFileId}`;
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
          sampleFileType: type,
          lastModified: updatedAt,
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
      sampleFileType: type,
      lastModified: updatedAt,
      fileDiff: { upload: { status: uploadStatus, progress: uploadProgress } },
    },
  });
};

export default updateSampleFileUpload;
