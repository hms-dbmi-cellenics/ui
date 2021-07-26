import { CELL_SETS_LOADED } from '../../actionTypes/cellSets';

const updateCellSets = (cellSets) => async (dispatch) => {
  dispatch({
    type: CELL_SETS_LOADED,
    payload: {
      data: cellSets,
    },
  });
};

export default updateCellSets;
