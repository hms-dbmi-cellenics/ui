import downloadFromUrl from 'utils/downloadFromUrl';
import fetchAPI from 'utils/http/fetchAPI';

const downloadSampleFile = async (experimentId, sampleUuid, fileType) => {
  const requestUrl = `/v2/experiments/${experimentId}/samples/${sampleUuid}/files/${fileType}/downloadUrl`;
  const downloadUrl = await fetchAPI(requestUrl);

  downloadFromUrl(downloadUrl);
};

export default downloadSampleFile;
