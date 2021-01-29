import initialState from './initialState';
import STYLING_CONFIG_UPDATE from '../../actionTypes/stylingConfig';
import updateStylingConfig from './updateStylingConfig';

const notificationsReducer = (state = initialState, action) => {
  switch (action.type) {
    case STYLING_CONFIG_UPDATE: {
      return updateStylingConfig(state, action);
    }

    default: {
      return state;
    }
  }
};

export default notificationsReducer;
