const EXPERIMENT_SETTINGS = 'experimentSettings';

/**
 * Loaded general information about the experiment.
 */
const EXPERIMENT_SETTINGS_INFO_UPDATE = `${EXPERIMENT_SETTINGS}/updateInfo`;

/**
 * Sets the state of the processing component to a state displayable by the system.
 */
const EXPERIMENT_SETTINGS_PROCESSING_LOAD = `${EXPERIMENT_SETTINGS}/loadProcessing`;

/**
 * Sets error value in store if there is error in loading
 */
const EXPERIMENT_SETTINGS_PROCESSING_ERROR = `${EXPERIMENT_SETTINGS}/errorProcessing`;

/**
 * Updates the processing component's configuration.
 */
const EXPERIMENT_SETTINGS_PROCESSING_UPDATE = `${EXPERIMENT_SETTINGS}/updateProcessing`;

/**
 * Saves the current state of the configuration to DynamoDB.
 */
const EXPERIMENT_SETTINGS_PROCESSING_SAVE = `${EXPERIMENT_SETTINGS}/saveProcessing`;

/**
 * Starts loading pipeline status from the API.
 */
const EXPERIMENT_SETTINGS_PIPELINE_STATUS_LOADING = `${EXPERIMENT_SETTINGS}/pipelineStatusLoading`;

/**
 * Loaded pipeline status from the API.
 */
const EXPERIMENT_SETTINGS_PIPELINE_STATUS_LOADED = `${EXPERIMENT_SETTINGS}/pipelineStatusLoaded`;

/**
 * Error state when pipeline status could not be loaded from the API.
 */
const EXPERIMENT_SETTINGS_PIPELINE_STATUS_ERROR = `${EXPERIMENT_SETTINGS}/pipelineStatusError`;

export {
  EXPERIMENT_SETTINGS_INFO_UPDATE,
  EXPERIMENT_SETTINGS_PROCESSING_LOAD,
  EXPERIMENT_SETTINGS_PROCESSING_UPDATE,
  EXPERIMENT_SETTINGS_PROCESSING_SAVE,
  EXPERIMENT_SETTINGS_PROCESSING_ERROR,
  EXPERIMENT_SETTINGS_PIPELINE_STATUS_LOADING,
  EXPERIMENT_SETTINGS_PIPELINE_STATUS_LOADED,
  EXPERIMENT_SETTINGS_PIPELINE_STATUS_ERROR,
};
