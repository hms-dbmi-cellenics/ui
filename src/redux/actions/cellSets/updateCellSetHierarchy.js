import { CELL_SETS_UPDATE_HIERARCHY } from '../../actionTypes/cellSets';
import saveCellSets from './saveCellSets';

const updateCellSetHierarchy = (experimentId, hierarchy) => async (dispatch, getState) => {
  const {
    loading, error, hierarchy: currentHierarchy,
  } = getState().cellSets;

  if (loading || error) {
    return null;
  }

  // Replace elements from old hierarchy that match.
  const newHierarchy = currentHierarchy.map(
    (obj) => hierarchy.find((o) => o.key === obj.key) || obj,
  );

  console.log(newHierarchy);

  await dispatch({
    type: CELL_SETS_UPDATE_HIERARCHY,
    payload: {
      experimentId,
      hierarchy: newHierarchy,
    },
  });

  await dispatch(saveCellSets(experimentId));
};

export default updateCellSetHierarchy;
