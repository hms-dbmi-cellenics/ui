import axios from 'axios';

const MAX_RETRIES = 3;

const putInS3 = async (
  blob, signedUrl, abortController, onUploadProgress, currentRetry = 0,
) => {
  try {
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
      return await putInS3(
        blob, signedUrl, abortController, onUploadProgress, currentRetry + 1,
      );
    }

    throw e;
  }
};

export default putInS3;
