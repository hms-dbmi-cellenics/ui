import downloadFromUrl from 'utils/data-management/downloadFromUrl';
import fetchAPI from 'utils/http/fetchAPI';

const downloadSingleFile = async (activeProjectUuid, sampleUuid, fileName) => {
  const downloadUrl = await fetchAPI(`/v1/projects/${activeProjectUuid}/samples/${sampleUuid}/${fileName}/downloadUrl`);
  downloadFromUrl(downloadUrl);
};

export default downloadSingleFile;
