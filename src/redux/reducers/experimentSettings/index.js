import initialState from './initialState';
import { EXPERIMENT_SETTINGS_PROCESSING_UPDATE } from '../../actionTypes/experimentSettings';
import updateProcessingSettings from './updateProcessingSettings';

const experimentSettingsReducer = (state = initialState, action) => {
  switch (action.type) {
    case EXPERIMENT_SETTINGS_PROCESSING_UPDATE: {
      return updateProcessingSettings(state, action);
    }
    default: {
      return state;
    }
  }
};

export default experimentSettingsReducer;
