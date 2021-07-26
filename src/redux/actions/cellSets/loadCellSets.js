import fetchAPI from '../../../utils/fetchAPI';
import { isServerError, throwIfRequestFailed } from '../../../utils/fetchErrors';
import endUserMessages from '../../../utils/endUserMessages';
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

  const url = `/v1/experiments/${experimentId}/cellSets`;
  try {
    const response = await fetchAPI(url);
    const json = await response.json();
    throwIfRequestFailed(response, json, endUserMessages.ERROR_FETCHING_CELL_SETS);
    dispatch({
      type: CELL_SETS_LOADED,
      payload: {
        experimentId,
        data: json.cellSets,
      },
    });
  } catch (e) {
    if (!isServerError(e)) {
      console.error(`fetch ${url} error ${e.message}`);
    }
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
