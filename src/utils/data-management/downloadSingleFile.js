import downloadFromUrl from 'utils/data-management/downloadFromUrl';
import fetchAPI from 'utils/http/fetchAPI';

import config from 'config';
import { api } from 'utils/constants';
import getFileTypeV2 from 'utils/getFileTypeV2';

const downloadSingleFile = async (activeProjectUuid, sampleUuid, fileName) => {
  let requestUrl;

  if (config.currentApiVersion === api.V1) {
    requestUrl = `/v1/projects/${activeProjectUuid}/samples/${sampleUuid}/${fileName}/downloadUrl`;
  } else if (config.currentApiVersion === api.V2) {
    const fileType = getFileTypeV2(fileName);

    // Content-Disposition: attachment; filename="foo.bar"

    requestUrl = `/v2/experiments/${activeProjectUuid}/samples/${sampleUuid}/files/${fileType}/downloadUrl`;
  }

  const downloadUrl = await fetchAPI(requestUrl);
  downloadFromUrl(downloadUrl);
};

export default downloadSingleFile;
