import {
  UPDATE_CONFIG, SAVE_CONFIG, LOAD_CONFIG, RESET_CONFIG,
  PLOT_DATA_LOADED, PLOT_DATA_LOADING, PLOT_DATA_ERROR, TRAJECTORY_NODES_SELECTION_UPDATED,
} from 'redux/actionTypes/componentConfig';

import initialState from 'redux/reducers/componentConfig/initialState';
import loadConfig from 'redux/reducers/componentConfig/loadConfig';
import updateConfig from 'redux/reducers/componentConfig/updateConfig';
import saveConfig from 'redux/reducers/componentConfig/saveConfig';
import resetConfig from 'redux/reducers/componentConfig/resetConfig';
import plotDataLoaded from 'redux/reducers/componentConfig/plotDataLoaded';
import plotDataLoading from 'redux/reducers/componentConfig/plotDataLoading';
import plotDataError from 'redux/reducers/componentConfig/plotDataError';

import trajectoryNodesUpdated from 'redux/reducers/componentConfig/trajectoryNodesUpdated';

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
    case TRAJECTORY_NODES_SELECTION_UPDATED:
      return trajectoryNodesUpdated(state, action);
    default:
      return state;
  }
};

export default plotsReducer;
