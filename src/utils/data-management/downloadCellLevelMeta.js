import downloadFromUrl from 'utils/downloadFromUrl';
import fetchAPI from 'utils/http/fetchAPI';

const downloadCellLevelMeta = async (experimentId, fileName, fileId) => {
  const requestUrl = `/v2/experiments/${experimentId}/cellLevelMeta/${fileId}/${fileName}`;
  const downloadUrl = await fetchAPI(requestUrl);
  downloadFromUrl(downloadUrl);
};

export default downloadCellLevelMeta;
