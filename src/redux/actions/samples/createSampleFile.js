import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';

import fetchAPI from 'utils/http/fetchAPI';
import { SAMPLES_FILE_UPDATE } from 'redux/actionTypes/samples';

import UploadStatus from 'utils/upload/UploadStatus';
import updateSampleFileUpload from 'redux/actions/samples/updateSampleFileUpload';
import fileNameForApiV1 from 'utils/upload/fileNameForApiV1';

const createSampleFile = (
  experimentId,
  sampleId,
  type,
  size,
  metadata,
  fileForApiV1,
) => async (dispatch) => {
  const updatedAt = moment().toISOString();

  try {
    const url = `/v2/experiments/${experimentId}/samples/${sampleId}/sampleFiles/${type}`;
    const body = {
      sampleFileId: uuidv4(),
      size,
      metadata,
    };

    dispatch({
      type: SAMPLES_FILE_UPDATE,
      payload: {
        sampleUuid: sampleId,
        lastModified: updatedAt,
        fileName: fileNameForApiV1[type],
        fileDiff: {
          upload: { status: UploadStatus.UPLOADING },
          ...fileForApiV1,
        },
      },
    });

    const signedUrl = await fetchAPI(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
    );

    return signedUrl;
  } catch (e) {
    dispatch(updateSampleFileUpload(experimentId, sampleId, type, UploadStatus.UPLOAD_ERROR));

    throw e;
  }
};

export default createSampleFile;
