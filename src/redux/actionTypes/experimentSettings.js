const EXPERIMENT_SETTINGS = 'experimentSettings';

/**
 * Loaded general information about the experiment.
 */
const EXPERIMENT_SETTINGS_INFO_UPDATE = `${EXPERIMENT_SETTINGS}/updateInfo`;

/**
 * Sets the state of the processing component to a state displayable by the system.
 */
const EXPERIMENT_SETTINGS_PROCESSING_CONFIG_LOADED = `${EXPERIMENT_SETTINGS}/loadedProcessingConfig`;

/**
 * Sets error value in store if there is error in loading
 */
const EXPERIMENT_SETTINGS_PROCESSING_ERROR = `${EXPERIMENT_SETTINGS}/errorProcessing`;

/**
 * Updates the processing component's configuration.
 */
const EXPERIMENT_SETTINGS_NON_SAMPLE_FILTER_UPDATE = `${EXPERIMENT_SETTINGS}/updateNonSampleFilterSettings`;

/**
 * Updates the processing component's configuration.
 */
const EXPERIMENT_SETTINGS_SAMPLE_FILTER_UPDATE = `${EXPERIMENT_SETTINGS}/updateSampleFilterSettings`;

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

/**
 * A QC step was enabled or disabled
 */
const EXPERIMENT_SETTINGS_SET_QC_STEP_ENABLED = `${EXPERIMENT_SETTINGS}/setQCStepEnabled`;

/**
 * The filter settings for one sample in one step were copied over to all other samples
 */
const EXPERIMENT_SETTINGS_COPY_SETTINGS_TO_ALL_SAMPLES = `${EXPERIMENT_SETTINGS}/copyFilterSettingsToAllSamples`;

const EXPERIMENT_SETTINGS_SET_SAMPLE_FILTER_SETTINGS_AUTO = `${EXPERIMENT_SETTINGS}/setSampleFilterSettingsAuto`;

/**
 * The filter settings for a filter were changed
 */
const EXPERIMENT_SETTINGS_ADD_CHANGED_QC_FILTER = `${EXPERIMENT_SETTINGS}/addChangedQCFilter`;

/**
 * The pending settings for filters were discarded
 */
const EXPERIMENT_SETTINGS_DISCARD_CHANGED_QC_FILTERS = `${EXPERIMENT_SETTINGS}/discardChangedQCFilters`;

/**
 * Received an update from qc for a sample in a step
 */
const EXPERIMENT_SETTINGS_UPDATE_SAMPLE_FROM_QC = `${EXPERIMENT_SETTINGS}/updateSampleProcessingSettingsFromQC`;

export {
  EXPERIMENT_SETTINGS_INFO_UPDATE,
  EXPERIMENT_SETTINGS_PROCESSING_CONFIG_LOADED,
  EXPERIMENT_SETTINGS_NON_SAMPLE_FILTER_UPDATE,
  EXPERIMENT_SETTINGS_SAMPLE_FILTER_UPDATE,
  EXPERIMENT_SETTINGS_PROCESSING_SAVE,
  EXPERIMENT_SETTINGS_PROCESSING_ERROR,
  EXPERIMENT_SETTINGS_BACKEND_STATUS_LOADING,
  EXPERIMENT_SETTINGS_BACKEND_STATUS_LOADED,
  EXPERIMENT_SETTINGS_BACKEND_STATUS_ERROR,
  EXPERIMENT_SETTINGS_PIPELINE_START,
  EXPERIMENT_SETTINGS_SET_QC_STEP_ENABLED,
  EXPERIMENT_SETTINGS_COPY_SETTINGS_TO_ALL_SAMPLES,
  EXPERIMENT_SETTINGS_SET_SAMPLE_FILTER_SETTINGS_AUTO,
  EXPERIMENT_SETTINGS_ADD_CHANGED_QC_FILTER,
  EXPERIMENT_SETTINGS_DISCARD_CHANGED_QC_FILTERS,
  EXPERIMENT_SETTINGS_UPDATE_SAMPLE_FROM_QC,
};
