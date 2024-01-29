import { loadEmbedding } from 'redux/actions/embedding';
import { loadProcessingSettings } from 'redux/actions/experimentSettings';

import fetchWork from 'utils/work/fetchWork';
import getTimeoutForWorkerTask from 'utils/getTimeoutForWorkerTask';
import writeToFileURL from 'utils/upload/writeToFileURL';
import downloadFromUrl from 'utils/downloadFromUrl';
import handleError from 'utils/http/handleError';
import endUserMessages from 'utils/endUserMessages';

const downloadProcessedMatrix = (experimentId) => async (dispatch, getState) => {
  try {
    await dispatch(loadProcessingSettings(experimentId));

    const {
      method: embeddingMethod,
      // embedding is saved in R object if downloading from project created by Seurat object upload
      useSaved: isSeurat,
    } = getState().experimentSettings.processing.configureEmbedding.embeddingSettings;

    await dispatch(loadEmbedding(experimentId, embeddingMethod, true));

    const taskName = 'DownloadAnnotSeuratObject';

    // the request needs the embeddingETag to merge that data with the rds
    // the embeddingETag is added by the API to this body
    const body = {
      name: taskName,
      embeddingMethod,
      isSeurat,
    };

    const timeout = getTimeoutForWorkerTask(getState(), taskName);

    const data = await fetchWork(
      experimentId, body, getState, dispatch, { timeout },
    );

    downloadFromUrl(writeToFileURL(data), `${experimentId}_processed_matrix.rds`);
  } catch (e) {
    handleError(e, endUserMessages.ERROR_DOWNLOADING_SEURAT_OBJECT);
  }
};

export default downloadProcessedMatrix;
