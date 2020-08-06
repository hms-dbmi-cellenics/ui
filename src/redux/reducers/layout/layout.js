import { UPDATE_LAYOUT } from '../../actionTypes/layout';
import initialState from './initialState';

const layoutReducer = (state = initialState, action) => {
  switch (action.type) {
    case UPDATE_LAYOUT:
      return {
        ...state,
        ...action.data,
      };
    default:
      return state;
  }
};

export default layoutReducer;
