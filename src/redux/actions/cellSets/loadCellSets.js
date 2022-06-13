import fetchAPI from 'utils/http/fetchAPI';
import handleError from 'utils/http/handleError';
import {
  CELL_SETS_LOADED, CELL_SETS_LOADING, CELL_SETS_ERROR,
} from 'redux/actionTypes/cellSets';
import endUserMessages from 'utils/endUserMessages';

import config from 'config';
import { api } from 'utils/constants';

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

  let url;

  if (config.currentApiVersion === api.V1) {
    url = `/v1/experiments/${experimentId}/cellSets`;
  } else if (config.currentApiVersion === api.V2) {
    url = `/v2/experiments/${experimentId}/cellSets`;
  }

  try {
    const data = await fetchAPI(url);

    dispatch({
      type: CELL_SETS_LOADED,
      payload: {
        experimentId,
        data: data.cellSets,
      },
    });
  } catch (e) {
    const errorMessage = handleError(e, endUserMessages.ERROR_FETCHING_CELL_SETS);

    dispatch({
      type: CELL_SETS_ERROR,
      payload: { error: errorMessage },
    });
  }
};

export default loadCellSets;
