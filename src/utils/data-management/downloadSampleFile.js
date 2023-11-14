import downloadFromUrl from 'utils/downloadFromUrl';
import fetchAPI from 'utils/http/fetchAPI';

import getFileTypeV2 from 'utils/getFileTypeV2';

const downloadSampleFile = async (experimentId, sampleUuid, fileName, selectedTech) => {
  const fileType = getFileTypeV2(fileName, selectedTech);

  const requestUrl = `/v2/experiments/${experimentId}/samples/${sampleUuid}/files/${fileType}/downloadUrl`;
  const downloadUrl = await fetchAPI(requestUrl);

  downloadFromUrl(downloadUrl);
};

export default downloadSampleFile;
