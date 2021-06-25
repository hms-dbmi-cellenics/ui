import { HYDRATE } from 'next-redux-wrapper';
import initialState from './initialState';
import {
  EXPERIMENT_SETTINGS_INFO_UPDATE,
  EXPERIMENT_SETTINGS_PROCESSING_CONFIG_LOADED,
  EXPERIMENT_SETTINGS_PROCESSING_UPDATE,
  EXPERIMENT_SETTINGS_SAMPLE_FILTER_UPDATE,
  EXPERIMENT_SETTINGS_PROCESSING_ERROR,
  EXPERIMENT_SETTINGS_BACKEND_STATUS_LOADING,
  EXPERIMENT_SETTINGS_BACKEND_STATUS_LOADED,
  EXPERIMENT_SETTINGS_BACKEND_STATUS_ERROR,
  EXPERIMENT_SETTINGS_SET_QC_STEP_ENABLED,
  EXPERIMENT_SETTINGS_COPY_SETTINGS_TO_ALL_SAMPLES,
  EXPERIMENT_SETTINGS_SET_SAMPLE_FILTER_SETTINGS_AUTO,
} from '../../actionTypes/experimentSettings';

import updateExperimentInfo from './updateExperimentInfo';
import updateProcessingSettings from './updateProcessingSettings';
import updateSampleFilterSettings from './updateSampleFilterSettings';
import loadedProcessingConfig from './loadedProcessingConfig';
import processingSettingsError from './processingSettingsError';
import backendStatusLoading from './backendStatusLoading';
import backendStatusLoaded from './backendStatusLoaded';
import backendStatusError from './backendStatusError';
import setQCStepEnabled from './setQCStepEnabled';
import copyFilterSettingsToAllSamples from './copyFilterSettingsToAllSamples';
import setSampleFilterSettingsAuto from './setSampleFilterSettingsAuto';

const experimentSettingsReducer = (state = initialState, action) => {
  switch (action.type) {
    case EXPERIMENT_SETTINGS_INFO_UPDATE: {
      return updateExperimentInfo(state, action);
    }
    case EXPERIMENT_SETTINGS_PROCESSING_CONFIG_LOADED: {
      return loadedProcessingConfig(state, action);
    }
    case EXPERIMENT_SETTINGS_PROCESSING_UPDATE: {
      return updateProcessingSettings(state, action);
    }
    case EXPERIMENT_SETTINGS_SAMPLE_FILTER_UPDATE: {
      return updateSampleFilterSettings(state, action);
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
    case EXPERIMENT_SETTINGS_SET_QC_STEP_ENABLED: {
      return setQCStepEnabled(state, action);
    }
    case EXPERIMENT_SETTINGS_COPY_SETTINGS_TO_ALL_SAMPLES: {
      return copyFilterSettingsToAllSamples(state, action);
    }
    case EXPERIMENT_SETTINGS_SET_SAMPLE_FILTER_SETTINGS_AUTO: {
      return setSampleFilterSettingsAuto(state, action);
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
