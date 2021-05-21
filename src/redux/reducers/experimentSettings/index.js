import { HYDRATE } from 'next-redux-wrapper';
import initialState from './initialState';
import {
  EXPERIMENT_SETTINGS_INFO_UPDATE,
  EXPERIMENT_SETTINGS_PROCESSING_LOAD,
  EXPERIMENT_SETTINGS_PROCESSING_UPDATE,
  EXPERIMENT_SETTINGS_SAMPLE_UPDATE,
  EXPERIMENT_SETTINGS_PROCESSING_ERROR,
  EXPERIMENT_SETTINGS_BACKEND_STATUS_LOADING,
  EXPERIMENT_SETTINGS_BACKEND_STATUS_LOADED,
  EXPERIMENT_SETTINGS_BACKEND_STATUS_ERROR,
} from '../../actionTypes/experimentSettings';
import updateExperimentInfo from './updateExperimentInfo';
import updateProcessingSettings from './updateProcessingSettings';
import updateSampleSettings from './updateSampleSettings';
import loadProcessingSettings from './loadProcessingSettings';
import processingSettingsError from './processingSettingsError';
import backendStatusLoading from './backendStatusLoading';
import backendStatusLoaded from './backendStatusLoaded';
import backendStatusError from './backendStatusError';

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
    case EXPERIMENT_SETTINGS_SAMPLE_UPDATE: {
      return updateSampleSettings(state, action);
    }
    case EXPERIMENT_SETTINGS_PROCESSING_ERROR: {
      return processingSettingsError(state, action);
    }
    case EXPERIMENT_SETTINGS_BACKEND_STATUS_LOADING: {
      return backendStatusLoading(state, action);
    }
    case EXPERIMENT_SETTINGS_BACKEND_STATUS_LOADED: {
      return backendStatusLoaded(state, action);
    }
    case EXPERIMENT_SETTINGS_BACKEND_STATUS_ERROR: {
      return backendStatusError(state, action);
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
