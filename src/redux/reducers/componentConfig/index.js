import {
  UPDATE_CONFIG, SAVE_CONFIG, LOAD_CONFIG, RESET_CONFIG,
  PLOT_DATA_LOADED, PLOT_DATA_LOADING, PLOT_DATA_ERROR,
} from 'redux/actionTypes/componentConfig';

import initialState from './initialState';
import loadConfig from './loadConfig';
import updateConfig from './updateConfig';
import saveConfig from './saveConfig';
import resetConfig from './resetConfig';
import plotDataLoaded from './plotDataLoaded';
import plotDataLoading from './plotDataLoading';
import plotDataError from './plotDataError';

const plotsReducer = (state = initialState, action) => {
  switch (action.type) {
    case LOAD_CONFIG:
      return loadConfig(state, action);
    case UPDATE_CONFIG:
      return updateConfig(state, action);
    case RESET_CONFIG:
      return resetConfig(state, action);
    case SAVE_CONFIG:
      return saveConfig(state, action);
    case PLOT_DATA_LOADED:
      return plotDataLoaded(state, action);
    case PLOT_DATA_LOADING:
      return plotDataLoading(state, action);
    case PLOT_DATA_ERROR:
      return plotDataError(state, action);
    default:
      return state;
  }
};

export default plotsReducer;
