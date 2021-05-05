import fetchAPI from '../../../utils/fetchAPI';
import {
  CELL_SETS_LOADED, CELL_SETS_LOADING, CELL_SETS_ERROR,
} from '../../actionTypes/cellSets';

const loadCellSets = (experimentId) => async (dispatch, getState) => {
  const {
    loading, error, updatingClustering,
  } = getState().cellSets;

  if ((!loading && !error) || updatingClustering) {
    return null;
  }
  if (getState().cellSets.error) {
    dispatch({
      type: CELL_SETS_LOADING,
    });
  }

  try {
    const response = await fetchAPI(`/v1/experiments/${experimentId}/cellSets`);
    const json = await response.json();
    dispatch({
      type: CELL_SETS_LOADED,
      payload: {
        experimentId,
        data: json.cellSets,
      },
    });
  } catch (e) {
    dispatch({
      type: CELL_SETS_ERROR,
      payload: {
        experimentId,
        error: e,
      },
    });
  }
};

export default loadCellSets;
