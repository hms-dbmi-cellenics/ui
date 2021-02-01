import initialState from './initialState';
import STYLING_CONFIG_UPDATE from '../../actionTypes/stylingConfig';
import updateStylingConfig from './updateStylingConfig';

const stylingConfigReducer = (state = initialState, action) => {
  switch (action.type) {
    case STYLING_CONFIG_UPDATE: {
      return updateStylingConfig(state, action);
    }

    default: {
      return state;
    }
  }
};

export default stylingConfigReducer;
