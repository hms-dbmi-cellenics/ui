import { HYDRATE } from 'next-redux-wrapper';
import initialState from './initialState';
import {
  EXPERIMENT_SETTINGS_INFO_UPDATE,
  EXPERIMENT_SETTINGS_PROCESSING_CONFIG_LOADED,
  EXPERIMENT_SETTINGS_NON_SAMPLE_FILTER_UPDATE,
  EXPERIMENT_SETTINGS_SAMPLE_FILTER_UPDATE,
  EXPERIMENT_SETTINGS_PROCESSING_ERROR,
  EXPERIMENT_SETTINGS_BACKEND_STATUS_LOADING,
  EXPERIMENT_SETTINGS_BACKEND_STATUS_LOADED,
  EXPERIMENT_SETTINGS_BACKEND_STATUS_ERROR,
  EXPERIMENT_SETTINGS_SET_QC_STEP_ENABLED,
  EXPERIMENT_SETTINGS_COPY_SETTINGS_TO_ALL_SAMPLES,
  EXPERIMENT_SETTINGS_SET_SAMPLE_FILTER_SETTINGS_AUTO,
  EXPERIMENT_SETTINGS_ADD_CHANGED_QC_FILTER,
  EXPERIMENT_SETTINGS_PIPELINE_START,
  EXPERIMENT_SETTINGS_DISCARD_CHANGED_QC_FILTERS,
  EXPERIMENT_SETTINGS_UPDATE_SAMPLE_FROM_QC,
} from '../../actionTypes/experimentSettings';

import updateNonSampleFilterSettings from './processingConfig/updateNonSampleFilterSettings';
import updateSampleFilterSettings from './processingConfig/updateSampleFilterSettings';
import loadedProcessingConfig from './processingConfig/loadedProcessingConfig';
import processingSettingsError from './processingConfig/processingSettingsError';
import backendStatusLoading from './backendStatus/backendStatusLoading';
import backendStatusLoaded from './backendStatus/backendStatusLoaded';
import backendStatusError from './backendStatus/backendStatusError';
import setQCStepEnabled from './processingConfig/setQCStepEnabled';
import copyFilterSettingsToAllSamples from './processingConfig/copyFilterSettingsToAllSamples';
import setSampleFilterSettingsAuto from './processingConfig/setSampleFilterSettingsAuto';
import addChangedQCFilter from './processingConfig/addChangedQCFilter';
import discardChangedQCFilters from './processingConfig/discardChangedQCFilters';
import updateSampleProcessingSettingsFromQC from './processingConfig/updateSampleProcessingSettingsFromQC';

import updateExperimentInfo from './updateExperimentInfo';
import pipelineStart from './pipelineStart';

const experimentSettingsReducer = (state = initialState, action) => {
  switch (action.type) {
    case EXPERIMENT_SETTINGS_INFO_UPDATE: {
      return updateExperimentInfo(state, action);
    }
    case EXPERIMENT_SETTINGS_PROCESSING_CONFIG_LOADED: {
      return loadedProcessingConfig(state, action);
    }
    case EXPERIMENT_SETTINGS_NON_SAMPLE_FILTER_UPDATE: {
      return updateNonSampleFilterSettings(state, action);
    }
    case EXPERIMENT_SETTINGS_SAMPLE_FILTER_UPDATE: {
      return updateSampleFilterSettings(state, action);
    }
    case EXPERIMENT_SETTINGS_UPDATE_SAMPLE_FROM_QC: {
      return updateSampleProcessingSettingsFromQC(state, action);
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
    case EXPERIMENT_SETTINGS_ADD_CHANGED_QC_FILTER: {
      return addChangedQCFilter(state, action);
    }
    case EXPERIMENT_SETTINGS_DISCARD_CHANGED_QC_FILTERS: {
      return discardChangedQCFilters(state, action);
    }
    case EXPERIMENT_SETTINGS_PIPELINE_START: {
      return pipelineStart(state, action);
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
