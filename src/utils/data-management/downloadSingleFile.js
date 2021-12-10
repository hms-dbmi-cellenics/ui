import downloadFromUrl from 'utils/data-management/downloadFromUrl';
import { getFromApiExpectOK } from 'utils/getDataExpectOK';

const downloadSingleFile = async (activeProjectUuid, sampleUuid, fileName) => {
  const downloadUrl = await getFromApiExpectOK(`/v1/projects/${activeProjectUuid}/samples/${sampleUuid}/${fileName}/downloadUrl`);
  downloadFromUrl(downloadUrl);
};

export default downloadSingleFile;
