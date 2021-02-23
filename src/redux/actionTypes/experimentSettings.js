const EXPERIMENT_SETTINGS = 'experimentSettings';

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
 * Marks a given step/filter as complete.
 */
const EXPERIMENT_SETTINGS_PROCESSING_COMPLETE_STEP = `${EXPERIMENT_SETTINGS}/completeStep`;

export {
  EXPERIMENT_SETTINGS_PROCESSING_LOAD,
  EXPERIMENT_SETTINGS_PROCESSING_UPDATE,
  EXPERIMENT_SETTINGS_PROCESSING_SAVE,
  EXPERIMENT_SETTINGS_PROCESSING_ERROR,
  EXPERIMENT_SETTINGS_PROCESSING_COMPLETE_STEP,
};
