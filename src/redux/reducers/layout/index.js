import { UPDATE_LAYOUT } from 'redux/actionTypes/layout';
import { initialLayoutSingleCell } from './initialState';
import updateLayout from './updateLayout';

const layoutReducer = (state = initialLayoutSingleCell, action) => {
  switch (action.type) {
    case UPDATE_LAYOUT:
      return updateLayout(state, action);

    default:
      return state;
  }
};

export default layoutReducer;
