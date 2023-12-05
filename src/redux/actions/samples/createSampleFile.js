import dayjs from 'dayjs';
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
  fileForApiV1,
  abortController,
) => async (dispatch) => {
  const updatedAt = dayjs().toISOString();

  const sampleFileId = uuidv4();

  try {
    const url = `/v2/experiments/${experimentId}/samples/${sampleId}/sampleFiles/${type}`;
    const body = {
      sampleFileId,
      size: fileForApiV1.size,
    };

    const {
      size,
      upload,
      // name: 'features.tsv.gz',
      fileObject,
      path,
      errors,
      compressed,
    } = fileForApiV1;

    const fileForRedux = {
      valid: true,
      size,
      upload,
      fileObject,
      path,
      errors,
      compressed,
    };

    dispatch({
      type: SAMPLES_FILE_UPDATE,
      payload: {
        sampleUuid: sampleId,
        lastModified: updatedAt,
        fileName: fileNameForApiV1[type],
        fileDiff: {
          // ...fileForApiV1,
          ...fileForRedux,
          upload: {
            status: UploadStatus.UPLOADING, progress: 0, abortController,
          },
        },
      },
    });

    await fetchAPI(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
    );

    return body.sampleFileId;
  } catch (e) {
    dispatch(updateSampleFileUpload(
      experimentId, sampleId, sampleFileId, type, UploadStatus.UPLOAD_ERROR,
    ));

    throw e;
  }
};

export default createSampleFile;
