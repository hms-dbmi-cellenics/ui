import _ from 'lodash';
import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';

import fetchAPI from 'utils/http/fetchAPI';
import { SAMPLES_FILE_UPDATE } from 'redux/actionTypes/samples';

import UploadStatus from 'utils/upload/UploadStatus';
import updateSampleFileUpload from 'redux/actions/samples/updateSampleFileUpload';

const createSampleFile = (
  experimentId,
  sampleId,
  type,
  file,
  abortController,
) => async (dispatch) => {
  const updatedAt = dayjs().toISOString();

  const sampleFileId = uuidv4();

  try {
    const url = `/v2/experiments/${experimentId}/samples/${sampleId}/sampleFiles/${type}`;
    const body = {
      sampleFileId,
      size: file.size,
    };

    // Leaving out path, errors
    // They are used during the upload process, not redux
    // TODO we should check if they can be separated somehow between
    // The ones that are relevant for the api vs
    // the ones that are only necessary for retry (fileObject, compressed)
    // Perhaps into an uploadRetryParams object or something
    const fileForRedux = _.pick(file, ['size', 'upload', 'fileObject', 'compressed']);

    dispatch({
      type: SAMPLES_FILE_UPDATE,
      payload: {
        sampleUuid: sampleId,
        sampleFileType: type,
        lastModified: updatedAt,
        fileDiff: {
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
