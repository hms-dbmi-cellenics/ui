import { updateProcessingSettings, updatePipelineStatus } from '../redux/actions/experimentSettings';

const experimentUpdatesHandler = (dispatch) => (experimentId, update) => {
  const { input, output, status } = update;

  const processingConfigUpdate = output.config;

  dispatch(updatePipelineStatus(experimentId, status));
  dispatch(updateProcessingSettings(experimentId, input.taskName, processingConfigUpdate));
};

export default experimentUpdatesHandler;
