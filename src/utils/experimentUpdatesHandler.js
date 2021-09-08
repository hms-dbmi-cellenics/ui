import { updateProcessingSettingsFromQC, loadedProcessingConfig } from '../redux/actions/experimentSettings';
import { updateBackendStatus } from '../redux/actions/backendStatus';
import updatePlotData from '../redux/actions/componentConfig/updatePlotData';

import { updateCellSetsClustering } from '../redux/actions/cellSets';

const updateTypes = {
  QC: 'qc',
  GEM2S: 'gem2s',
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

  if (input.taskName === 'configureEmbedding') {
    dispatch(updateCellSetsClustering(experimentId));
  }
};

const onGEM2SUpdate = (update, dispatch, experimentId) => {
  const processingConfig = update?.item?.processingConfig;
  if (processingConfig) {
    dispatch(loadedProcessingConfig(experimentId, processingConfig, true));
  }
};

export default experimentUpdatesHandler;
