import { updateBackendStatus, updateProcessingSettingsFromQC, loadedProcessingConfig } from '../redux/actions/experimentSettings';
import updatePlotData from '../redux/actions/componentConfig/updatePlotData';

import { updateCellSetsClustering } from '../redux/actions/cellSets';

const updateTypes = {
  QC: 'qc',
  GEM2S: 'gem2s',
  WORKER_DATA_UPDATE: 'workerDataUpdate',
};

const experimentUpdatesHandler = (dispatch) => (experimentId, update) => {
  if (update.response?.error) {
    return;
  }

  switch (update.type) {
    case updateTypes.QC: {
      dispatch(updateBackendStatus(update.status));
      return onQCUpdate(update, dispatch);
    }
    case updateTypes.GEM2S: {
      dispatch(updateBackendStatus(update.status));
      return onGEM2SUpdate(update, dispatch, experimentId);
    }
    case updateTypes.WORKER_DATA_UPDATE: {
      return onWorkerUpdate(experimentId, update, dispatch);
    }

    default: {
      console.log(`Error, unrecognized message type ${update.type}`);
    }
  }
};

const onQCUpdate = (update, dispatch) => {
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
};

const onGEM2SUpdate = (update, dispatch, experimentId) => {
  const processingConfig = update?.item?.processingConfig;
  if (processingConfig) {
    dispatch(loadedProcessingConfig(experimentId, processingConfig, true));
  }
};

const onWorkerUpdate = (experimentId, update, dispatch) => {
  const reqName = update.response.request.body.name;

  if (reqName === 'ClusterCells') {
    const louvainSets = JSON.parse(update.response.results[0].body);
    const newCellSets = [
      louvainSets,
    ];

    dispatch(updateCellSetsClustering(experimentId, newCellSets));
  }
};

export default experimentUpdatesHandler;
