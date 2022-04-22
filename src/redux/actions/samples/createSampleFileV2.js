import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';

// import endUserMessages from 'utils/endUserMessages';
// import mergeObjectWithArrays from 'utils/mergeObjectWithArrays';
// import UploadStatus from 'utils/upload/UploadStatus';
// import handleError from 'utils/http/handleError';

import fetchAPI from 'utils/http/fetchAPI';
import { SAMPLES_FILE_UPDATE } from 'redux/actionTypes/samples';

const fileNameForApiV1 = {
  matrix10x: 'matrix.mtx.gz',
  barcodes10x: 'barcodes.tsv.gz',
  features10x: 'features.tsv.gz',
};

const createSampleFileV2 = (
  experimentId,
  sampleId,
  type,
  size,
  metadata,
  fileForApiV1,
) => async (dispatch) => {
  const payload = {
    sampleFileId: uuidv4(),
    size,
    metadata,
  };

  const url = `/v2/experiments/${experimentId}/samples/${sampleId}/sampleFiles/${type}`;
  try {
    const signedUrl = await fetchAPI(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      },
    );

    const updatedAt = moment().toISOString();

    dispatch({
      type: SAMPLES_FILE_UPDATE,
      payload: {
        sampleUuid: sampleId,
        lastModified: updatedAt,
        fileName: fileNameForApiV1[type],
        fileDiff: fileForApiV1,
      },
    });

    return signedUrl;
  } catch (e) {
    // const errorMessage = handleError(e, endUserMessages.ERROR_SAVING);
  }
};

export default createSampleFileV2;
