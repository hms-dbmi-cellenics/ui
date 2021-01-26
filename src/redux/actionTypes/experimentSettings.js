const EXPERIMENT_SETTINGS = 'experimentSettings';

/**
 * Turns on the loading state for a given processing component.
 */
const EXPERIMENT_SETTINGS_PROCESSING_LOADING = `${EXPERIMENT_SETTINGS}/loadingProcessing`;

/**
 * Sets the state of the processing component to a state displayable by the system.
 */
const EXPERIMENT_SETTINGS_PROCESSING_LOADED = `${EXPERIMENT_SETTINGS}/loadedProcessing`;

/**
 * Updates the processing component's configuration.
 */
const EXPERIMENT_SETTINGS_PROCESSING_UPDATE = `${EXPERIMENT_SETTINGS}/updateProcessing`;

const EXPERIMENT_SETTINGS_PROCESSING_ERROR = `${EXPERIMENT_SETTINGS}/errorProcessing`;

export {
  EXPERIMENT_SETTINGS_PROCESSING_LOADING,
  EXPERIMENT_SETTINGS_PROCESSING_LOADED,
  EXPERIMENT_SETTINGS_PROCESSING_UPDATE,
  EXPERIMENT_SETTINGS_PROCESSING_ERROR,
};
