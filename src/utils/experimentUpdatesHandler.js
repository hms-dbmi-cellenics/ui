import { updateProcessingSettings, updatePipelineStatus } from '../redux/actions/experimentSettings';
import updatePlotData from '../redux/actions/componentConfig/updatePlotData';

const experimentUpdatesHandler = (dispatch) => (experimentId, update) => {
  const { input, output, status } = update;

  const processingConfigUpdate = output.config;

  dispatch(updatePipelineStatus(experimentId, status));
  dispatch(updateProcessingSettings(experimentId, input.taskName, processingConfigUpdate));

  Object.entries(output.plotData).forEach(([plotUuid, plotData]) => {
    dispatch(updatePlotData(plotUuid, plotData));
  });
};

export default experimentUpdatesHandler;
