import axios from 'axios';

const FILE_CHUNK_SIZE = 10000000;

const uploadParts = async (file, signedUrls, createOnUploadProgressForPart) => {
  const promises = [];

  signedUrls.forEach((signedUrl, index) => {
    const start = index * FILE_CHUNK_SIZE;
    const end = (index + 1) * FILE_CHUNK_SIZE;
    const blob = index < signedUrls.length
      ? file.fileObject.slice(start, end)
      : file.fileObject.slice(start);

    const req = axios.request({
      method: 'put',
      data: blob,
      url: signedUrl,
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      onUploadProgress: createOnUploadProgressForPart(index),
    });

    promises.push(req);
  });

  const resParts = await Promise.all(promises);

  return resParts.map((part, index) => ({
    ETag: part.headers.etag,
    PartNumber: index + 1,
  }));
};

export default uploadParts;
