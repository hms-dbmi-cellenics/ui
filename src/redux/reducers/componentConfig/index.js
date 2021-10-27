import {
  UPDATE_CONFIG, SAVE_CONFIG, LOAD_CONFIG, LOAD_DATA,
} from 'redux/actionTypes/componentConfig';
import initialState from './initialState';
import loadConfig from './loadConfig';
import loadData from './loadData';
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
    case LOAD_DATA:
      return loadData(state, action);
    default:
      return state;
  }
};

export default plotsReducer;
