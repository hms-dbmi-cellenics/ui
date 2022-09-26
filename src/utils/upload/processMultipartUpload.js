import Axios from 'axios';

const FILE_CHUNK_SIZE = 10000000;

const uploadParts = async (file, urls) => {
  const axios = Axios.create();
  delete axios.defaults.headers.put['Content-Type'];

  const { signedUrls } = urls;
  const promises = [];

  signedUrls.forEach((signedUrl, index) => {
    const start = index * FILE_CHUNK_SIZE;
    const end = (index + 1) * FILE_CHUNK_SIZE;
    const blob = index < signedUrls.length
      ? file.fileObject.slice(start, end)
      : file.fileObject.slice(start);

    promises.push(axios.put(signedUrl, blob));
  });

  const resParts = await Promise.all(promises);

  return resParts.map((part, index) => ({
    ETag: part.headers.etag,
    PartNumber: index + 1,
  }));
};

export default uploadParts;
