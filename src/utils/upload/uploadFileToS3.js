import _ from 'lodash';

import fetchAPI from 'utils/http/fetchAPI';
import axios from 'axios';
import UploadStatus from './UploadStatus';
import loadFileInStream from './loadFileInStream';

const MB = 1024 * 1024;
const chunkSize = 128 * MB;

const uploadFileToS3 = async (
  experimentId,
  file,
  compress,
  uploadUrlParams,
  type,
  abortController,
  onStatusUpdate = () => { },
) => {
  const {
    uploadId, fileId, bucket, key,
  } = uploadUrlParams;

  if (!uploadId || !fileId || !bucket || !key) {
    throw new Error('uploadUrlParams must contain uploadId, fileId, bucket, and key');
  }

  try {
    const uploadParams = {
      experimentId,
      uploadId,
      bucket,
      key,
    };

    const responses = await processMultipartUpload(
      file, compress, uploadParams, abortController, onStatusUpdate,
    );

    await completeMultipartUpload(responses, uploadId, fileId, type);

    onStatusUpdate(UploadStatus.UPLOADED, 100);
  } catch (e) {
    onStatusUpdate(UploadStatus.UPLOAD_ERROR);
  }
};

const processMultipartUpload = async (
  file, compress, uploadParams, abortController, onStatusUpdate,
) => {
  const parts = [];

  const totalChunks = Math.ceil(file.size / chunkSize);

  const uploadedPartPercentages = new Array(totalChunks).fill(0);

  const createOnUploadProgress = (partNumber) => (progress) => {
    // partNumbers are 1-indexed, so we need to subtract 1 for the array index
    uploadedPartPercentages[partNumber - 1] = progress.progress;

    const percentage = _.mean(uploadedPartPercentages) * 100;
    onStatusUpdate(UploadStatus.UPLOADING, Math.floor(percentage));
  };

  await loadFileInStream(
    file,
    compress,
    chunkSize,
    async (compressedPart, partNumber) => {
      const partResponse = await putPartInS3(
        compressedPart,
        uploadParams,
        partNumber,
        abortController,
        createOnUploadProgress(partNumber),
      );

      parts.push({ ETag: partResponse.headers.etag, PartNumber: partNumber });
    },
  );

  parts.sort(({ PartNumber: PartNumber1 }, { PartNumber: PartNumber2 }) => {
    if (PartNumber1 === PartNumber2) throw new Error('Non-unique partNumbers found, each number should be unique');

    return PartNumber1 > PartNumber2 ? 1 : -1;
  });

  return parts;
};

const MAX_RETRIES = 3;

const getSignedUrlForPart = async (uploadParams, partNumber) => {
  const {
    experimentId, uploadId, bucket, key,
  } = uploadParams;

  const queryParams = new URLSearchParams({ bucket, key });
  const url = `/v2/experiments/${experimentId}/upload/${uploadId}/part/${partNumber}/signedUrl?${queryParams}`;

  return await fetchAPI(url, { method: 'GET' });
};

const putPartInS3 = async (
  blob, uploadParams, partNumber, abortController, onUploadProgress, currentRetry = 0,
) => {
  try {
    const signedUrl = await getSignedUrlForPart(uploadParams, partNumber);

    return await axios.request({
      method: 'put',
      data: blob,
      url: signedUrl,
      signal: abortController.signal,
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      onUploadProgress,
    });
  } catch (e) {
    if (currentRetry < MAX_RETRIES) {
      return await putPartInS3(
        blob, uploadParams, partNumber, abortController, onUploadProgress, currentRetry + 1,
      );
    }

    throw e;
  }
};

const completeMultipartUpload = async (parts, uploadId, fileId, type) => {
  const requestUrl = '/v2/completeMultipartUpload';

  const body = {
    parts, uploadId, fileId, type,
  };

  await fetchAPI(requestUrl,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
};

export default uploadFileToS3;
