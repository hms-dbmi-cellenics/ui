import updateCellSetsClustering from 'redux/actions/cellSets/updateCellSetsClustering';
import { updateProcessingSettingsFromQC, loadedProcessingConfig } from 'redux/actions/experimentSettings';
import { updateBackendStatus } from 'redux/actions/backendStatus';
import updatePlotData from 'redux/actions/componentConfig/updatePlotData';
import pushNotificationMessage from 'utils/pushNotificationMessage';

import { loadCellSets } from 'redux/actions/cellSets';
import endUserMessages from './endUserMessages';

const updateTypes = {
  QC: 'qc',
  GEM2S: 'gem2s',
  WORK_RESPONSE: 'WorkResponse',
};

const experimentUpdatesHandler = (dispatch) => (experimentId, update) => {
  if (update.status) {
    dispatch(updateBackendStatus(experimentId, update.status));
  }

  if (update.response?.error) {
    return;
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

const onQCUpdate = (update, dispatch, experimentId) => {
  const { input, output } = update;

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
  const processingConfig = update?.item?.processingConfig;
  if (processingConfig) {
    dispatch(loadedProcessingConfig(experimentId, processingConfig, true));
  }
};

const onWorkResponseUpdate = (update, dispatch, experimentId) => {
  const { request: { body }, response: { error } } = update;

  if (error) throw new Error(error);

  if (body.name === 'ClusterCells') {
    dispatch(updateCellSetsClustering(experimentId));
    pushNotificationMessage('success', endUserMessages.SUCCESS_CELL_SETS_RECLUSTERED);
  }

  if (body.name === 'GetExpressionCellSets') {
    dispatch(loadCellSets(experimentId));
    pushNotificationMessage('success', endUserMessages.SUCCESS_NEW_CLUSTER_CREATED);
  }
};

export default experimentUpdatesHandler;
