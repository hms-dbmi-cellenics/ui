import fetchAPI from '../../../utils/fetchAPI';
import endUserMessages from '../../../utils/endUserMessages';
import { isServerError, throwIfRequestFailed } from '../../../utils/fetchErrors';
import {
  EXPERIMENT_SETTINGS_BACKEND_STATUS_LOADING,
  EXPERIMENT_SETTINGS_BACKEND_STATUS_LOADED,
  EXPERIMENT_SETTINGS_BACKEND_STATUS_ERROR,
} from '../../actionTypes/experimentSettings';
import pipelineStatusValues from '../../../utils/pipelineStatusValues';

// used to mock a success backend status response from the API
const date = (new Date()).toISOString();
const mockSuccessStatus = {
  pipeline: {
    startDate: date,
    stopDate: date,
    status: 'SUCCEEDED',
    completedSteps: [
      'ClassifierFilter',
      'CellSizeDistributionFilter',
      'MitochondrialContentFilter',
      'NumGenesVsNumUmisFilter',
      'DoubletScoresFilter',
      'DataIntegration',
      'ConfigureEmbedding'],
  },
  gem2s: {
    startDate: date,
    stopDate: date,
    status: 'SUCCEEDED',
    completedSteps: [
      'DownloadGem',
      'PreProcessing',
      'EmptyDrops',
      'DoubletScores',
      'CreateSeurat',
      'PrepareExperiment',
      'UploadToAWS'],
  },
  worker: {
    status: 'NotLaunched',
    started: false,
    ready: false,
    restartCount: 0,
  },
};

const loadBackendStatus = (experimentId) => async (dispatch) => {
  dispatch({
    type: EXPERIMENT_SETTINGS_BACKEND_STATUS_LOADING,
    payload: {
      experimentId,
    },
  });

  const url = `/v1/experiments/${experimentId}/backendStatus`;
  try {
    const response = await fetchAPI(url);
    let status = await response.json();

    // if we are running locally and the pipelines have not been started, mock up a success
    // status to allow developers to go to data-processing & data-exploration without
    // having to run the pipelines
    if (process.env.NODE_ENV === 'development'
      && (status.gem2s.status === pipelineStatusValues.NOT_CREATED
        || status.qc.status === pipelineStatusValues.NOT_CREATED)) {
      status = mockSuccessStatus;
    }

    throwIfRequestFailed(response, status, endUserMessages.ERROR_FETCHING_STATUS);
    dispatch({
      type: EXPERIMENT_SETTINGS_BACKEND_STATUS_LOADED,
      payload: {
        experimentId,
        status,
      },
    });

    return status;
  } catch (e) {
    if (!isServerError(e)) {
      console.error(`fetch ${url} error ${e.message}`);
    }
    dispatch({
      type: EXPERIMENT_SETTINGS_BACKEND_STATUS_ERROR,
      payload: {
        error: 'Could not get the status of the backend.',
        errorType: e,
      },
    });
  }
};

export default loadBackendStatus;
