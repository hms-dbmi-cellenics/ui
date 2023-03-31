import { loadEmbedding } from 'redux/actions/embedding';
import { loadProcessingSettings } from 'redux/actions/experimentSettings';

import fetchWork from 'utils/work/fetchWork';
import getTimeoutForWorkerTask from 'utils/getTimeoutForWorkerTask';
import writeToFileURL from 'utils/writeToFileURL';
import downloadFromUrl from 'utils/downloadFromUrl';
import getEmbeddingETag from 'utils/work/getEmbeddingETag';

const downloadProcessedMatrix = (experimentId) => async (dispatch, getState) => {
  await dispatch(loadProcessingSettings(experimentId));

  const {
    method: embeddingMethod,
  } = getState().experimentSettings.processing.configureEmbedding.embeddingSettings;

  await dispatch(loadEmbedding(experimentId, embeddingMethod));

  const taskName = 'DownloadAnnotSeuratObject';

  const body = {
    name: taskName,
    embeddingETag: await getEmbeddingETag(experimentId, getState, dispatch),
  };

  const timeout = getTimeoutForWorkerTask(getState(), taskName);

  const data = await fetchWork(
    experimentId, body, getState, dispatch, { timeout },
  );

  downloadFromUrl(writeToFileURL(data), 'rds.r');
};

export default downloadProcessedMatrix;
