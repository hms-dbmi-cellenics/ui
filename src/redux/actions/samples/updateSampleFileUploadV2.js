import moment from 'moment';

import { SAMPLES_FILE_UPDATE } from 'redux/actionTypes/samples';

const fileNameForApiV1 = {
  matrix10x: 'matrix.mtx.gz',
  barcodes10x: 'barcodes.tsv.gz',
  features10x: 'features.tsv.gz',
};

const updateSampleFileUploadV2 = (
  experimentId, sampleId, type, uploadStatus, uploadProgress,
) => async (dispatch) => {
  // const payload =
  // const url = `/v2/experiments/${experimentId}/samples/${sampleId}/sampleFiles/${type}`;

  // try {
  //   const signedUrl = await fetchAPI(
  //     url,
  //     {
  //       method: 'PUT',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify(payload),
  //     },
  //   );
  // } catch (e) {

  // }

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
