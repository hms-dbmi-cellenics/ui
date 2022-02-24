import updateCellSetsClustering from 'redux/actions/cellSets/updateCellSetsClustering';
import { updateProcessingSettingsFromQC, loadedProcessingConfig } from 'redux/actions/experimentSettings';
import { updateBackendStatus } from 'redux/actions/backendStatus';
import updatePlotData from 'redux/actions/componentConfig/updatePlotData';
import { loadCellSets } from 'redux/actions/cellSets';

import pushNotificationMessage from 'utils/pushNotificationMessage';

import endUserMessages from 'utils/endUserMessages';

const updateTypes = {
  QC: 'qc',
  GEM2S: 'gem2s',
  WORK_RESPONSE: 'WorkResponse',
};

const experimentUpdatesHandler = (dispatch) => (experimentId, update) => {
  switch (update.type) {
    case updateTypes.QC: {
      return onQCUpdate(update, dispatch, experimentId);
    }
    case updateTypes.GEM2S: {
      return onGEM2SUpdate(update, dispatch, experimentId);
    }
    case updateTypes.WORK_RESPONSE: {
      return onWorkResponseUpdate(update, dispatch, experimentId);
    }
    default: {
      console.log(`Error, unrecognized message type ${update.type}`);
    }
  }

  if (update.status) {
    dispatch(updateBackendStatus(experimentId, update.status));
  }
};

const onQCUpdate = (update, dispatch, experimentId) => {
  const { input, output, response: { error, errorCode, userMessage } } = update;

  console.warn('*** error', error);
  console.warn('*** errorCode', error);
  console.warn('*** userMessage', error);

  if (error) {
    console.log(errorCode, userMessage);
    pushNotificationMessage('error', userMessage);
  }

  const processingConfigUpdate = output.config;

  if (processingConfigUpdate) {
    dispatch(updateProcessingSettingsFromQC(
      input.taskName,
      processingConfigUpdate,
      input.sampleUuid,
      false,
    ));

    Object.entries(output.plotData).forEach(([plotUuid, plotData]) => {
      dispatch(updatePlotData(plotUuid, plotData));
    });
  }

  // If the pipeline finished we have a new clustering, so fetch it
  if (update.status.pipeline.status === 'SUCCEEDED') {
    dispatch(loadCellSets(experimentId, true));
  }
};

const onGEM2SUpdate = (update, dispatch, experimentId) => {
  const { response: { error, errorCode, userMessage } } = update;

  if (error) {
    console.log(errorCode, userMessage);
    pushNotificationMessage('error', userMessage);
  }

  const processingConfig = update.item?.processingConfig;
  if (processingConfig) {
    dispatch(loadedProcessingConfig(experimentId, processingConfig, true));
  }
};

const onWorkResponseUpdate = (update, dispatch, experimentId) => {
  const {
    request: { body: { name: workRequestName } },
    response: { error, errorCode, userMessage },
  } = update;

  if (error) {
    if (workRequestName === 'GetExpressionCellSets') {
      switch (errorCode) {
        case 'R_WORKER_EMPTY_CELL_SET':
          pushNotificationMessage('error', endUserMessages.EMPTY_CLUSTER_NOT_CREATED);
          return;

        default:
          break;
      }
    }

    pushNotificationMessage('error', userMessage);
    return;
  }

  if (workRequestName === 'ClusterCells') {
    dispatch(updateCellSetsClustering(experimentId));
    pushNotificationMessage('success', endUserMessages.SUCCESS_CELL_SETS_RECLUSTERED);
  }

  if (workRequestName === 'GetExpressionCellSets') {
    dispatch(loadCellSets(experimentId, true));
    pushNotificationMessage('success', endUserMessages.SUCCESS_NEW_CLUSTER_CREATED);
  }
};

export default experimentUpdatesHandler;
export { updateTypes };
