import { UPDATE_CONFIG, SAVE_CONFIG, LOAD_CONFIG } from '../../actionTypes/componentConfig';
import initialState from './initialState';
import loadConfig from './loadConfig';
import updateConfig from './updateConfig';
import saveConfig from './saveConfig';

const plotsReducer = (state = initialState, action) => {
  switch (action.type) {
    case LOAD_CONFIG:
      return loadConfig(state, action);
    case UPDATE_CONFIG:
      return updateConfig(state, action);
    case SAVE_CONFIG:
      return saveConfig(state, action);
    default:
      return state;
  }
};

export default plotsReducer;
