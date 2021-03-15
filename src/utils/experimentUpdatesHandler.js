import updateProcessingSettings from '../redux/actions/experimentSettings/updateProcessingSettings';

const experimentUpdatesHandler = (dispatch) => (experimentId, update) => {
  const { taskName } = update.input;
  const processingConfigUpdate = update.output.config;

  dispatch(updateProcessingSettings(experimentId, taskName, processingConfigUpdate));
};

export default experimentUpdatesHandler;
