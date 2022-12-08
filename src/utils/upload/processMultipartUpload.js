import axios from 'axios';

const FILE_CHUNK_SIZE = 10000000;
const MAX_RETRIES = 2;

const putPartInS3 = (blob, signedUrl, onUploadProgress, currentRetry = 0) => axios.request({
  method: 'put',
  data: blob,
  url: signedUrl,
  headers: {
    'Content-Type': 'application/octet-stream',
  },
  onUploadProgress,
})
  .catch(() => {
    if (currentRetry < MAX_RETRIES) {
      putPartInS3(blob, signedUrl, onUploadProgress, currentRetry + 1);
    }
  });

const uploadParts = async (fileObject, signedUrls, createOnUploadProgressForPart) => {
  const promises = [];

  signedUrls.forEach((signedUrl, index) => {
    const start = index * FILE_CHUNK_SIZE;
    const end = (index + 1) * FILE_CHUNK_SIZE;
    const blob = index < signedUrls.length
      ? fileObject.slice(start, end)
      : fileObject.slice(start);

    const req = putPartInS3(blob, signedUrl, createOnUploadProgressForPart(index));
    promises.push(req);
  });

  const resParts = await Promise.all(promises);

  return resParts.map((part, index) => ({
    ETag: part.headers.etag,
    PartNumber: index + 1,
  }));
};

export default uploadParts;
