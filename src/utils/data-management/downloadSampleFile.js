import downloadFromUrl from 'utils/downloadFromUrl';
import fetchAPI from 'utils/http/fetchAPI';

const getSampleFileUrls = async (experimentId, sampleUuid, fileType) => {
  const requestUrl = `/v2/experiments/${experimentId}/samples/${sampleUuid}/files/${fileType}/downloadUrl`;
  const result = await fetchAPI(requestUrl);

  return result;
};

const downloadSampleFile = async (experimentId, sampleUuid, fileType) => {
  const result = await getSampleFileUrls(experimentId, sampleUuid, fileType);
  // returns array of objects [{url: '', fileId: ''}]
  downloadFromUrl(result[0].url);
};

export { getSampleFileUrls, downloadSampleFile };
