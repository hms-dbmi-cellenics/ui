import { HYDRATE } from 'next-redux-wrapper';
import initialState from './initialState';
import {
  EXPERIMENT_SETTINGS_INFO_UPDATE,
  EXPERIMENT_SETTINGS_PROCESSING_LOAD,
  EXPERIMENT_SETTINGS_PROCESSING_UPDATE,
  EXPERIMENT_SETTINGS_PROCESSING_ERROR,
  EXPERIMENT_SETTINGS_PIPELINE_STATUS_LOADING,
  EXPERIMENT_SETTINGS_PIPELINE_STATUS_LOADED,
  EXPERIMENT_SETTINGS_PIPELINE_STATUS_ERROR,
} from '../../actionTypes/experimentSettings';
import updateExperimentInfo from './updateExperimentInfo';
import updateProcessingSettings from './updateProcessingSettings';
import loadProcessingSettings from './loadProcessingSettings';
import processingSettingsError from './processingSettingsError';
import pipelineStatusLoading from './pipelineStatusLoading';
import pipelineStatusLoaded from './pipelineStatusLoaded';
import pipelineStatusError from './pipelineStatusError';

const experimentSettingsReducer = (state = initialState, action) => {
  switch (action.type) {
    case EXPERIMENT_SETTINGS_INFO_UPDATE: {
      return updateExperimentInfo(state, action);
    }
    case EXPERIMENT_SETTINGS_PROCESSING_LOAD: {
      return loadProcessingSettings(state, action);
    }
    case EXPERIMENT_SETTINGS_PROCESSING_UPDATE: {
      return updateProcessingSettings(state, action);
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
    case HYDRATE: {
      const experimentInfo = action.payload.experimentSettings.info;

      if (experimentInfo) {
        return { ...state, info: experimentInfo };
      }

      return state;
    }
    default: {
      return state;
    }
  }
};

export default experimentSettingsReducer;
