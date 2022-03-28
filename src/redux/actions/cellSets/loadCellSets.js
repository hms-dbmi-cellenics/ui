import fetchAPI from 'utils/http/fetchAPI';
import handleError from 'utils/http/handleError';
import {
  CELL_SETS_LOADED, CELL_SETS_LOADING, CELL_SETS_ERROR,
} from 'redux/actionTypes/cellSets';
import endUserMessages from 'utils/endUserMessages';

const loadCellSets = (experimentId, forceReload = false) => async (dispatch, getState) => {
  const {
    loading, error, updatingClustering,
  } = getState().cellSets;

  if (!forceReload && ((!loading && !error) || updatingClustering)) {
    return null;
  }

  if (error) {
    dispatch({
      type: CELL_SETS_LOADING,
    });
  }

  const url = `/v1/experiments/${experimentId}/cellSets`;
  try {
    const data = await fetchAPI(url);
    console.log('cell sets loaded lcs');
    dispatch({
      type: CELL_SETS_LOADED,
      payload: {
        experimentId,
        data: data.cellSets,
      },
    });
  } catch (e) {
    const errorMessage = handleError(e, endUserMessages.ERROR_FETCHING_CELL_SETS);
    console.log(`cell sets failed to load lcs message ${errorMessage}`);

    dispatch({
      type: CELL_SETS_ERROR,
      payload: { error: errorMessage },
    });
  }
};

export default loadCellSets;
