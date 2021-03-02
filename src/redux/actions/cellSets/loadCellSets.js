import getApiEndpoint from '../../../utils/apiEndpoint';
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
  // There is only two way this action dispatcher does anything. Either
  // it is called after an error condition, or in a loading state. In the former
  // state, dispatching the loading action is unnecessary.

  // Apart from this, if the clustering is being updated,
  // this action dispatcher ends too since we will get a more up to date when the task is done

  if (getState().cellSets.error) {
    dispatch({
      type: CELL_SETS_LOADING,
    });
  }

  try {
    const response = await fetch(`${getApiEndpoint()}/v1/experiments/${experimentId}/cellSets`);
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
