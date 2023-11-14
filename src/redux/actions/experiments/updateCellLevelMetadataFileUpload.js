import { EXPERIMENT_CELL_METADATA_UPDATED } from 'redux/actionTypes/experiments';
import endUserMessages from 'utils/endUserMessages';
import fetchAPI from 'utils/http/fetchAPI';
import handleError from 'utils/http/handleError';
import UploadStatus from 'utils/upload/UploadStatus';

const updateCellLevelMetadataFileUpload = (
  experimentId, uploadStatus, percentProgress,
) => async (dispatch) => {
  // Don't send an api update whenever the progress bar is updated, only for uploadStatus changes
  // TODO: move progress to not even be a part of redux, manage it in a different way
  if (uploadStatus !== UploadStatus.UPLOADING) {
    const url = `/v2/experiments/${experimentId}/cellLevelMeta`;
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
      handleError(e, endUserMessages.ERROR_UPDATE_SERVER_ON_UPLOAD_STATE);
    }
  }

  dispatch({
    type: EXPERIMENT_CELL_METADATA_UPDATED,
    payload: {
      experimentId,
      cellLevelMetadata: { uploadStatus, percentProgress },
    },
  });
};

export default updateCellLevelMetadataFileUpload;
