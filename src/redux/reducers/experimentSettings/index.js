import initialState from './initialState';
import {
  EXPERIMENT_SETTINGS_PROCESSING_LOAD,
  EXPERIMENT_SETTINGS_PROCESSING_UPDATE,
  EXPERIMENT_SETTINGS_PROCESSING_COMPLETE_STEP,
} from '../../actionTypes/experimentSettings';
import updateProcessingSettings from './updateProcessingSettings';
import loadProcessingSettings from './loadProcessingSettings';
import completeProcessingStep from './completeProcessingStep';

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
    default: {
      return state;
    }
  }
};

export default experimentSettingsReducer;
