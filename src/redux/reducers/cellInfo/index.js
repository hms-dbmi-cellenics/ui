import { CELL_INFO_UPDATE, CELL_INFO_FOCUS, CELL_INFO_UNFOCUS } from '../../actionTypes/cellInfo';
import { EXPERIMENT_SETTINGS_PIPELINE_START } from '../../actionTypes/experimentSettings';

import initialState from './initialState';
import updateCellInfo from './updateCellInfo';
import cellInfoFocus from './cellInfoFocus';
import cellInfoUnfocus from './cellInfoUnfocus';

const cellInfoReducer = (state = initialState, action) => {
  switch (action.type) {
    case CELL_INFO_UPDATE: {
      return updateCellInfo(state, action);
    }
    case CELL_INFO_FOCUS: {
      return cellInfoFocus(state, action);
    }
    case CELL_INFO_UNFOCUS: {
      return cellInfoUnfocus(state, action);
    }
    case EXPERIMENT_SETTINGS_PIPELINE_START: {
      return initialState;
    }
    default: {
      return state;
    }
  }
};

export default cellInfoReducer;
