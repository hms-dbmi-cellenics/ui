import initialState from './initialState';
import {
  EXPERIMENT_SETTINGS_PROCESSING_LOAD,
  EXPERIMENT_SETTINGS_PROCESSING_UPDATE,
  EXPERIMENT_SETTINGS_SET_COMPLETED_STEPS,
  EXPERIMENT_SETTINGS_PROCESSING_ERROR,
  EXPERIMENT_SETTINGS_PIPELINE_STATUS_LOADING,
  EXPERIMENT_SETTINGS_PIPELINE_STATUS_LOADED,
  EXPERIMENT_SETTINGS_PIPELINE_STATUS_ERROR,
} from '../../actionTypes/experimentSettings';
import updateProcessingSettings from './updateProcessingSettings';
import loadProcessingSettings from './loadProcessingSettings';
import setCompletedSteps from './setCompletedSteps';
import processingSettingsError from './processingSettingsError';
import pipelineStatusLoading from './pipelineStatusLoading';
import pipelineStatusLoaded from './pipelineStatusLoaded';
import pipelineStatusError from './pipelineStatusError';

const experimentSettingsReducer = (state = initialState, action) => {
  switch (action.type) {
    case EXPERIMENT_SETTINGS_PROCESSING_LOAD: {
      return loadProcessingSettings(state, action);
    }
    case EXPERIMENT_SETTINGS_PROCESSING_UPDATE: {
      return updateProcessingSettings(state, action);
    }
    case EXPERIMENT_SETTINGS_SET_COMPLETED_STEPS: {
      return setCompletedSteps(state, action);
    }
    case EXPERIMENT_SETTINGS_PROCESSING_ERROR: {
      return processingSettingsError(state, action);
    }
    case EXPERIMENT_SETTINGS_PIPELINE_STATUS_LOADING: {
      return pipelineStatusLoading(state, action);
    }
    case EXPERIMENT_SETTINGS_PIPELINE_STATUS_LOADED: {
      return pipelineStatusLoaded(state, action);
    }
    case EXPERIMENT_SETTINGS_PIPELINE_STATUS_ERROR: {
      return pipelineStatusError(state, action);
    }
    default: {
      return state;
    }
  }
};

export default experimentSettingsReducer;
