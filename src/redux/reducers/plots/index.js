import PLOT_CONFIG_UPDATE from '../../actionTypes/plots';
import initialState from './initialState';
import updateConfig from './updateConfig';

const plotsReducer = (state = initialState, action) => {
  switch (action.type) {
    case PLOT_CONFIG_UPDATE:
      return updateConfig(state, action);
    default:
      return state;
  }
};

export default plotsReducer;
