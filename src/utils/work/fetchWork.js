import { isBrowser } from 'utils/deploymentInfo';

import cache from 'utils/cache';
import dispatchWorkRequest from 'utils/work/dispatchWorkRequest';
import downloadFromS3 from 'utils/work/downloadFromS3';
import waitForWorkRequest from 'utils/work/waitForWorkRequest';

// retrieveData will try to get the data for the given experimentId and ETag from
// the fastest source possible. It will try to get the data in order from:
// 1. Browser cache
// 2. S3 (cache) via signedURL
// 3. Worker
//   3.1. Via socket (small data)
//   3.2. Via S3 (large data) via signedURL
const retrieveData = async (experimentId,
  ETag,
  signedUrl,
  request,
  timeout,
  body,
  dispatch,
  useCache) => {
  // 1. Check if we have the ETag in the browser cache (no worker)
  const cachedData = useCache ? await cache.get(ETag) : null;
  if (cachedData) {
    return cachedData;
  }

  // 2. Check if data is cached in S3 so we can download from the signed URL (no worker)
  if (signedUrl) {
    return await downloadFromS3(body.name, signedUrl);
  }

  // 3. If we don't have signedURL, wait for the worker to send us the data via
  // - the data via socket
  // - the signedURL to download the data from S3
  const { signedUrl: workerSignedUrl, data } = await waitForWorkRequest(
    ETag,
    experimentId,
    request,
    timeout,
    dispatch,
  );

  // 3.1. The worker send the data via socket because it's small enough
  if (data) {
    return data;
  }
  // 3.2. The worker send a signedUrl to download the data
  return await downloadFromS3(body.name, workerSignedUrl);
};

const fetchWork = async (
  experimentId,
  body,
  getState,
  dispatch,
  optionals = {},
) => {
  const {
    extras = undefined,
    timeout = 180,
    broadcast = false,
    onETagGenerated = () => { },
  } = optionals;

  if (!isBrowser) {
    throw new Error('Disabling network interaction on server');
  }

  // 1. Contact the API to get ETag and possible S3 signedURL
  const { ETag, signedUrl, request } = await dispatchWorkRequest(
    experimentId,
    body,
    timeout,
    {
      broadcast,
      ...extras,
    },
    getState,
  );

  onETagGenerated(ETag);

  const useCache = body.name !== 'GeneExpression';

  // 2. Try to get the data from the fastest source possible
  const data = await retrieveData(
    experimentId, ETag, signedUrl, request, timeout, body, dispatch, useCache,
  );

  // 3. Cache the data in the browser
  if (useCache) {
    await cache.set(ETag, data);
  }

  return data;
};

export default fetchWork;
