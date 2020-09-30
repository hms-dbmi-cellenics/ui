/* eslint-disable import/prefer-default-export */
import {
  UPDATE_CELL_INFO,
} from '../actionTypes';

const updateCellInfo = (cellData) => (dispatch) => {
  dispatch({
    type: UPDATE_CELL_INFO,
    payload: {
      ...cellData,
    },
  });
};

export {
  updateCellInfo,
};
