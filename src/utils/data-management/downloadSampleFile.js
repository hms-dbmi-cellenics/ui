import downloadFromUrl from 'utils/downloadFromUrl';
import fetchAPI from 'utils/http/fetchAPI';
import ZipFileStore from 'components/data-exploration/spatial/ZipFileStore';

const fetchSampleFileUrls = async (experimentId, sampleUuid, fileType) => {
  const requestUrl = `/v2/experiments/${experimentId}/samples/${sampleUuid}/files/${fileType}/downloadUrl`;
  const result = await fetchAPI(requestUrl);

  return result;
};

// Signed urls are cached per experiment/sample/fileType so remounting a spatial
// plot (e.g. switching between Data Processing, Data Exploration and Plots and
// tables) reuses the same url — which in turn lets the url-keyed zip store and
// pyramid caches hit instead of re-reading each zip's central directory. The API
// signs these for 24h; re-sign well before that.
const URL_CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const urlCache = new Map();

const getSampleFileUrls = (experimentId, sampleUuid, fileType) => {
  const key = `${experimentId}/${sampleUuid}/${fileType}`;
  const cached = urlCache.get(key);
  if (cached && Date.now() - cached.fetchedAt < URL_CACHE_TTL_MS) return cached.promise;

  const promise = fetchSampleFileUrls(experimentId, sampleUuid, fileType).then((result) => {
    // sizes let ZipFileStore range-read spatial zips instead of downloading them
    if (Array.isArray(result)) {
      result.forEach(({ url, size }) => ZipFileStore.registerSize(url, size));
    }
    return result;
  });
  // don't cache failures (e.g. a file that isn't there yet)
  promise.catch(() => { if (urlCache.get(key)?.promise === promise) urlCache.delete(key); });
  urlCache.set(key, { promise, fetchedAt: Date.now() });
  return promise;
};

const clearSampleFileUrlCache = () => urlCache.clear();

const downloadSampleFile = async (experimentId, sampleUuid, fileType) => {
  const result = await fetchSampleFileUrls(experimentId, sampleUuid, fileType);
  // returns array of objects [{url: '', fileId: ''}]
  downloadFromUrl(result[0].url);
};

export { getSampleFileUrls, clearSampleFileUrlCache, downloadSampleFile };
