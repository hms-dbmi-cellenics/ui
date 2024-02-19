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
    // signedUrls,
    uploadId, fileId, bucket, key,
  } = uploadUrlParams;

  // eslint-disable-next-line no-unused-vars
  const createOnUploadProgressForPart = (partIndex) => (progress) => { };

  // const uploadedPartSizes = new Array(signedUrls.length).fill(0);
  // const totalSize = file.size;

  // const createOnUploadProgressForPart = (partIndex) => (progress) => {
  //   uploadedPartSizes[partIndex] = progress.loaded;
  //   const totalUploaded = _.sum(uploadedPartSizes);
  //   const percentProgress = Math.floor((totalUploaded * 100) / totalSize);

  //   onStatusUpdate(UploadStatus.UPLOADING, percentProgress);
  // };

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
  const responsesPromises = [];

  await streamLoadAndCompressIfNecessary(
    file,
    async (compressedChunk, index) => {
      const partNumber = index;

      const partResponse = await putPartInS3v2(
        compressedChunk,
        uploadParams,
        partNumber,
        createOnUploadProgressForPart(partNumber),
        abortController,
        0,
      );

      responsesPromises.push({ ETag: partResponse.headers.etag, PartNumber: partNumber });
    },
    () => {
      // On progress
    },
  );

  return responsesPromises;
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
