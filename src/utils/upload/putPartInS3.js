import axios from 'axios';
import fetchAPI from 'utils/http/fetchAPI';

const MAX_RETRIES = 3;

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

const getSignedUrlForPart = async (uploadParams, partNumber) => {
  const {
    experimentId, uploadId, bucket, key,
  } = uploadParams;

  const queryParams = new URLSearchParams({ bucket, key });
  const url = `/v2/experiments/${experimentId}/upload/${uploadId}/part/${partNumber}/signedUrl?${queryParams}`;

  return await fetchAPI(url, { method: 'GET' });
};

export default putPartInS3;
