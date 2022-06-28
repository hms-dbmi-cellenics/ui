import downloadFromUrl from 'utils/data-management/downloadFromUrl';
import fetchAPI from 'utils/http/fetchAPI';

import getFileTypeV2 from 'utils/getFileTypeV2';

const downloadSingleFile = async (activeProjectUuid, sampleUuid, fileName) => {
  const fileType = getFileTypeV2(fileName);

  const requestUrl = `/v2/experiments/${activeProjectUuid}/samples/${sampleUuid}/files/${fileType}/downloadUrl`;
  const downloadUrl = await fetchAPI(requestUrl);

  downloadFromUrl(downloadUrl);
};

export default downloadSingleFile;
