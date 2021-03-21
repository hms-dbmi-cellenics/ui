import { updateProcessingSettings, updatePipelineStatus } from '../redux/actions/experimentSettings';
import loadEmbedding from '../redux/actions/embedding/loadEmbedding';
import updatePlotData from '../redux/actions/componentConfig/updatePlotData';

const experimentUpdatesHandler = (dispatch) => (experimentId, update) => {
  const { input, output, status } = update;

  const processingConfigUpdate = output.config;

  dispatch(updatePipelineStatus(experimentId, status));
  dispatch(updateProcessingSettings(experimentId, input.taskName, processingConfigUpdate));

  Object.entries(output.plotData).forEach(([plotUuid, plotData]) => {
    dispatch(updatePlotData(plotUuid, plotData));
  });

  // This is temporary, should be taken out eventually as it will be handled
  // once we clean up the redux store (which is the correct action to take here)
  dispatch(loadEmbedding(experimentId, 'umap'));
  dispatch(loadEmbedding(experimentId, 'tsne'));
};

export default experimentUpdatesHandler;
