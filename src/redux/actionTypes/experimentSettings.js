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
 * Updates the processing component's configuration.
 */
const EXPERIMENT_SETTINGS_SAMPLE_UPDATE = `${EXPERIMENT_SETTINGS}/updateSampleSettings`;

/**
 * Saves the current state of the configuration to DynamoDB.
 */
const EXPERIMENT_SETTINGS_PROCESSING_SAVE = `${EXPERIMENT_SETTINGS}/saveProcessing`;

/**
 * Signals that a pipeline run was initiated by the user.
 */
const EXPERIMENT_SETTINGS_PIPELINE_START = `${EXPERIMENT_SETTINGS}/startPipeline`;

/**
 * Starts loading pipeline status from the API.
 */
const EXPERIMENT_SETTINGS_BACKEND_STATUS_LOADING = `${EXPERIMENT_SETTINGS}/backendStatusLoading`;

/**
 * Loaded pipeline status from the API.
 */
const EXPERIMENT_SETTINGS_BACKEND_STATUS_LOADED = `${EXPERIMENT_SETTINGS}/backendStatusLoaded`;

/**
 * Error state when backend status could not be loaded from the API.
 */
const EXPERIMENT_SETTINGS_BACKEND_STATUS_ERROR = `${EXPERIMENT_SETTINGS}/backendStatusError`;

export {
  EXPERIMENT_SETTINGS_INFO_UPDATE,
  EXPERIMENT_SETTINGS_PROCESSING_LOAD,
  EXPERIMENT_SETTINGS_PROCESSING_UPDATE,
  EXPERIMENT_SETTINGS_SAMPLE_UPDATE,
  EXPERIMENT_SETTINGS_PROCESSING_SAVE,
  EXPERIMENT_SETTINGS_PROCESSING_ERROR,
  EXPERIMENT_SETTINGS_BACKEND_STATUS_LOADING,
  EXPERIMENT_SETTINGS_BACKEND_STATUS_LOADED,
  EXPERIMENT_SETTINGS_BACKEND_STATUS_ERROR,
  EXPERIMENT_SETTINGS_PIPELINE_START,
};
