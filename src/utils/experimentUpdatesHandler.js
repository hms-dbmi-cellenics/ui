import { updateProcessingSettings, updateBackendStatus } from '../redux/actions/experimentSettings';
// import { loadSamples } from '../redux/actions/samples';
import loadEmbedding from '../redux/actions/embedding/loadEmbedding';
import updatePlotData from '../redux/actions/componentConfig/updatePlotData';

const updateTypes = {
  QC: 'qc',
  GEM2S: 'gem2s',
};

const experimentUpdatesHandler = (dispatch) => (experimentId, update) => {
  dispatch(updateBackendStatus(experimentId, update.status));

  switch (update.type) {
    case updateTypes.QC: {
      return onDataProcessingUpdate(experimentId, update, dispatch);
    }
    case updateTypes.GEM2S: {
      return onGEM2SUpdate(experimentId, update, dispatch);
    }
    default: {
      console.log(`Error, unrecognized message type ${update.type}`);
    }
  }
};

const onDataProcessingUpdate = (experimentId, update, dispatch) => {
  const { input, output } = update;

  const processingConfigUpdate = output.config;
  if (processingConfigUpdate) {
    dispatch(updateProcessingSettings(experimentId, input.taskName, processingConfigUpdate));

    Object.entries(output.plotData).forEach(([plotUuid, plotData]) => {
      dispatch(updatePlotData(plotUuid, plotData));
    });

    // This is temporary, should be taken out eventually as it will be handled
    // once we clean up the redux store (which is the correct action to take here)
    dispatch(loadEmbedding(experimentId, 'umap'));
    dispatch(loadEmbedding(experimentId, 'tsne'));
  }
};

// const onGEM2SUpdate = (experimentId, update, dispatch) => {
// dispatch(loadSamples(experimentId));
const onGEM2SUpdate = () => {
};

export default experimentUpdatesHandler;
