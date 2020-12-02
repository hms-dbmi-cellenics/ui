import { CELL_INFO_UPDATE, CELL_INFO_FOCUS, CELL_INFO_UNFOCUS } from '../../actionTypes/cellInfo';
import initialState from './initialState';
import cellInfoUpdate from './cellInfoUpdate';
import cellInfoFocus from './cellInfoFocus';
import cellInfoUnfocus from './cellInfoUnfocus';

const cellInfoReducer = (state = initialState, action) => {
  switch (action.type) {
    case CELL_INFO_UPDATE: {
      return cellInfoUpdate(state, action);
    }

    case CELL_INFO_FOCUS: {
      return cellInfoFocus(state, action);
    }

    case CELL_INFO_UNFOCUS: {
      return cellInfoUnfocus(state, action);
    }

    default: {
      return state;
    }
  }
};

export default cellInfoReducer;
