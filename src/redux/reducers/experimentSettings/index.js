import initialState from './initialState';
import {
  EXPERIMENT_SETTINGS_PROCESSING_LOAD,
  EXPERIMENT_SETTINGS_PROCESSING_UPDATE,
  EXPERIMENT_SETTINGS_PROCESSING_COMPLETE_STEP,
  EXPERIMENT_SETTINGS_PROCESSING_ERROR,
  EXPERIMENT_SETTINGS_PIPELINE_STATUS_UPDATE,
} from '../../actionTypes/experimentSettings';
import updateProcessingSettings from './updateProcessingSettings';
import loadProcessingSettings from './loadProcessingSettings';
import completeProcessingStep from './completeProcessingStep';
import processingSettingsError from './processingSettingsError';
import pipelineStatusUpdate from './pipelineStatusUpdate';

const experimentSettingsReducer = (state = initialState, action) => {
  switch (action.type) {
    case EXPERIMENT_SETTINGS_PROCESSING_LOAD: {
      return loadProcessingSettings(state, action);
    }
    case EXPERIMENT_SETTINGS_PROCESSING_UPDATE: {
      return updateProcessingSettings(state, action);
    }
    case EXPERIMENT_SETTINGS_PROCESSING_COMPLETE_STEP: {
      return completeProcessingStep(state, action);
    }
    case EXPERIMENT_SETTINGS_PROCESSING_ERROR: {
      return processingSettingsError(state, action);
    }
    case EXPERIMENT_SETTINGS_PIPELINE_STATUS_UPDATE: {
      return pipelineStatusUpdate(state, action);
    }
    default: {
      return state;
    }
  }
};

export default experimentSettingsReducer;
