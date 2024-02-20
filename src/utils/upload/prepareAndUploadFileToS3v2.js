import fetchAPI from 'utils/http/fetchAPI';
import axios from 'axios';
import UploadStatus from './UploadStatus';
import streamLoadAndCompressIfNecessary from './streamLoadAndCompressIfNecessary';

const prepareAndUploadFileToS3v2 = async (
  experimentId,
  file,
  uploadUrlParams,
  type,
  abortController,
  onStatusUpdate = () => { },
) => {
  const {
    uploadId, fileId, bucket, key,
  } = uploadUrlParams;

  // eslint-disable-next-line no-unused-vars
  const createOnUploadProgressForPart = (partIndex) => (progress) => { };

  try {
    const uploadParams = {
      experimentId,
      uploadId,
      bucket,
      key,
    };

    const responses = await processMultipartUploadv2(
      file, uploadParams, createOnUploadProgressForPart, abortController, onStatusUpdate,
    );

    await completeMultipartUpload(responses, uploadId, fileId, type);

    onStatusUpdate(UploadStatus.UPLOADED, 100);
  } catch (e) {
    onStatusUpdate(UploadStatus.UPLOAD_ERROR);
  }
};

const processMultipartUploadv2 = async (
  file, uploadParams, createOnUploadProgressForPart, abortController,
) => {
  const parts = [];

  const partUploader = async (compressedPart, partNumber) => {
    const partResponse = await putPartInS3v2(
      compressedPart,
      uploadParams,
      partNumber,
      createOnUploadProgressForPart(partNumber),
      abortController,
      0,
    );

    parts.push({ ETag: partResponse.headers.etag, PartNumber: partNumber });
  };

  await streamLoadAndCompressIfNecessary(
    file,
    partUploader,
    () => {
      // On progress
    },
  );

  parts.sort(({ PartNumber: PartNumber1 }, { PartNumber: PartNumber2 }) => {
    if (PartNumber1 === PartNumber2) throw new Error('Non-unique partNumbers found, each number should be unique');

    return PartNumber1 > PartNumber2 ? 1 : -1;
  });

  return parts;
};

// const processMultipartUploadv2 = async (
//   file, signedUrls, createOnUploadProgressForPart, abortController,
// ) => {
//   signedUrls.forEach((signedUrl, index) => {
//     const start = index * FILE_CHUNK_SIZE;
//     const end = (index + 1) * FILE_CHUNK_SIZE;
//     const blob = index < signedUrls.length
//       ? file.fileObject.slice(start, end)
//       : file.fileObject.slice(start);

//     const req = putPartInS3v2(
//       blob,
//       signedUrl,
//       createOnUploadProgressForPart(index),
//       abortController,
//       0,
//     );

//     promises.push(req);
//   });

//   const resParts = await Promise.all(promises);

//   return resParts.map((part, index) => ({
//     ETag: part.headers.etag,
//     PartNumber: index + 1,
//   }));
// };

// const MAX_RETRIES = 3;
const MAX_RETRIES = 0;

const getSignedUrlForPart = async (uploadParams, partNumber) => {
  const {
    experimentId, uploadId, bucket, key,
  } = uploadParams;

  const queryParams = new URLSearchParams({ bucket, key });
  const url = `/v2/experiments/${experimentId}/upload/${uploadId}/part/${partNumber}/signedUrl?${queryParams}`;

  return await fetchAPI(url, { method: 'GET' });
};

const putPartInS3v2 = async (
  blob, uploadParams, partNumber, onUploadProgress, abortController, currentRetry = 0,
) => {
  try {
    const signedUrl = await getSignedUrlForPart(uploadParams, partNumber);

    console.log('signedUrlDebug');
    console.log(signedUrl);

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
      return await putPartInS3v2(
        blob, uploadParams, partNumber, onUploadProgress, abortController, currentRetry + 1,
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

export default prepareAndUploadFileToS3v2;