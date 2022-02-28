import { updateCellSetsClustering, loadCellSets } from 'redux/actions/cellSets';
import { updateProcessingSettingsFromQC, loadedProcessingConfig } from 'redux/actions/experimentSettings';
import { updateBackendStatus } from 'redux/actions/backendStatus';
import { updatePlotData } from 'redux/actions/componentConfig';

import pushNotificationMessage from 'utils/pushNotificationMessage';

import endUserMessages from 'utils/endUserMessages';

const updateTypes = {
  QC: 'qc',
  GEM2S: 'gem2s',
  WORK_RESPONSE: 'WorkResponse',
};

const experimentUpdatesHandler = (dispatch) => (experimentId, update) => {
  if (update.status) {
    dispatch(updateBackendStatus(experimentId, update.status));
  }

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
};

const onGEM2SUpdate = (update, dispatch, experimentId) => {
  const { response } = update;

  if (response?.error) {
    console.error(response.error);
    pushNotificationMessage('error', endUserMessages.ERROR_RUNNING_PIPELINE);
    return;
  }

  const processingConfig = update.item?.processingConfig;
  if (processingConfig) {
    dispatch(loadedProcessingConfig(experimentId, processingConfig, true));
  }
};

const onQCUpdate = (update, dispatch, experimentId) => {
  const { input, output, response } = update;

  if (response?.error) {
    console.error(response.error);
    pushNotificationMessage('error', endUserMessages.ERROR_RUNNING_PIPELINE);
    return;
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

const onWorkResponseUpdate = (update, dispatch, experimentId) => {
  const {
    request: { body: { name: workRequestName } },
    response: { error, errorCode, userMessage },
  } = update;

  if (error) {
    console.error(errorCode, userMessage);

    handleWorkResponseError(workRequestName, errorCode, userMessage);
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

const handleWorkResponseError = (workRequestName, errorCode, userMessage) => {
  const workResponseErrorHandler = {
    GetExpressionCellSets: {
      R_WORKER_EMPTY_CELL_SET: () => pushNotificationMessage('error', endUserMessages.EMPTY_CLUSTER_NOT_CREATED),
    },
  };

  const errorHandler = workResponseErrorHandler[workRequestName]?.[errorCode];

  console.warn('*** error', errorHandler);

  if (!errorHandler) {
    pushNotificationMessage('error', userMessage);
    return;
  }

  errorHandler();
};

export default experimentUpdatesHandler;
export { updateTypes };
