import moment from 'moment';

import { SAMPLES_FILE_UPDATE } from 'redux/actionTypes/samples';
import endUserMessages from 'utils/endUserMessages';
import fetchAPI from 'utils/http/fetchAPI';
import handleError from 'utils/http/handleError';

const fileNameForApiV1 = {
  matrix10x: 'matrix.mtx.gz',
  barcodes10x: 'barcodes.tsv.gz',
  features10x: 'features.tsv.gz',
};

const updateSampleFileUploadV2 = (
  experimentId, sampleId, type, uploadStatus, uploadProgress,
) => async (dispatch) => {
  // Don't send an api update whenever the progress bar is updated, only for uploadStatus changes
  // TODO: move progress to not even be a part of redux, manage it in a different way
  if (!uploadProgress) {
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
      // This error means that we couldn't update the api on the state of the upload
      // Should we block the upload from continuing? The upload itself isn't necessarily compromised
      handleError(e, endUserMessages.ERROR_UPDATE_SERVER_ON_UPLOAD_STATE);
    }
  }

  const updatedAt = moment().toISOString();

  // Even if we failed to persist the update in the api it is still
  // valid information so we should dispatch the action anyways
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

export default updateSampleFileUploadV2;
