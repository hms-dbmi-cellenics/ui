import { UPDATE_PLOT_CONFIG, SAVE_PLOT_CONFIG, LOAD_PLOT_CONFIG } from '../../actionTypes/plots';
import initialState from './initialState';
import loadConfig from './loadConfig';
import updateConfig from './updateConfig';
import saveConfig from './saveConfig';


const plotsReducer = (state = initialState, action) => {
  switch (action.type) {
    case LOAD_PLOT_CONFIG:
      return loadConfig(state, action);
    case UPDATE_PLOT_CONFIG:
      return updateConfig(state, action);
    case SAVE_PLOT_CONFIG:
      return saveConfig(state, action);
    default:
      return state;
  }
};

export default plotsReducer;
