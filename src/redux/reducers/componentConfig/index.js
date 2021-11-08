import {
  UPDATE_CONFIG, SAVE_CONFIG, LOAD_CONFIG,
  PLOT_DATA_LOADED, PLOT_DATA_LOADING,
} from 'redux/actionTypes/componentConfig';
import initialState from './initialState';
import loadConfig from './loadConfig';
import updateConfig from './updateConfig';
import saveConfig from './saveConfig';
import loadPlotData from './plotDataLoaded';
import plotDataLoading from './plotDataLoading';

const plotsReducer = (state = initialState, action) => {
  switch (action.type) {
    case LOAD_CONFIG:
      return loadConfig(state, action);
    case UPDATE_CONFIG:
      return updateConfig(state, action);
    case SAVE_CONFIG:
      return saveConfig(state, action);
    case PLOT_DATA_LOADED:
      return loadPlotData(state, action);
    case PLOT_DATA_LOADING:
      return plotDataLoading(state, action);
    default:
      return state;
  }
};

export default plotsReducer;
