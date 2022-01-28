import {
  CELL_SETS_UNHIDE_ALL,
} from '../../actionTypes/cellSets';

const unhideAllCellSets = () => (dispatch) => {
  dispatch({
    type: CELL_SETS_UNHIDE_ALL,
  });
};

export default unhideAllCellSets;
