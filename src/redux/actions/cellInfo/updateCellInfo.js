/* eslint-disable import/prefer-default-export */
import {
  CELL_INFO_UPDATE,
} from '../../actionTypes/cellInfo';

const updateCellInfo = (cellData) => (dispatch) => {
  dispatch({
    type: CELL_INFO_UPDATE,
    payload: {
      ...cellData,
    },
  });
};

export default updateCellInfo;
