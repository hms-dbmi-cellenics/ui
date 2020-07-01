import getApiEndpoint from '../../../utils/apiEndpoint';
import loadCellSets from './loadCellSets';
import { cacheFetch } from '../../../utils/cacheRequest';
import {
  CELL_SETS_LOADING, CELL_SETS_ERROR,
} from '../../actionTypes/cellSets';

const resetCellSets = (experimentId) => async (dispatch, getState) => {
  const {
    loading, error,
  } = getState().cellSets;

  if (loading || error) {
    return null;
  }

  const requestOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  };

  dispatch({
    type: CELL_SETS_LOADING,
  });

  try {
    await cacheFetch(`${getApiEndpoint()}/v1/experiments/generate`, requestOptions);
    dispatch(loadCellSets(experimentId));
  } catch (e) {
    dispatch({
      type: CELL_SETS_ERROR,
      payload: {
        experimentId,
        error: "Couldn't reset cell sets to default.",
      },
    });
  }
};

export default resetCellSets;
