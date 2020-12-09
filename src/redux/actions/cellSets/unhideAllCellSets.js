import {
  CELL_SETS_UNHIDE_ALL,
} from '../../actionTypes/cellSets';

const unhideAllCellSets = (
  experimentId,
) => (dispatch) => {
  dispatch({
    type: CELL_SETS_UNHIDE_ALL,
    payload: {
      experimentId,
    },
  });
};

export default unhideAllCellSets;
