import getApiEndpoint from '../../../utils/apiEndpoint';
import {
  CELL_SETS_LOADED, CELL_SETS_LOADING, CELL_SETS_ERROR,
} from '../../actionTypes/cellSets';

const loadCellSets = (experimentId) => async (dispatch, getState) => {
  const {
    loading, error,
  } = getState().cellSets;

  if (!loading && !error) {
    return null;
  }

  // There is only two way this action dispatcher does anything. Either
  // it is called after an error condition, or in a loading state. In the former
  // state, dispatching the loading action is unnecessary.
  if (getState().cellSets.error) {
    dispatch({
      type: CELL_SETS_LOADING,
    });
  }

  await fetch(`${getApiEndpoint()}/v1/experiments/${experimentId}/cellSets`).then(
    (response) => response.json(),
  ).then(
    (json) => dispatch({
      type: CELL_SETS_LOADED,
      payload: {
        experimentId,
        data: json.cellSets,
      },
    }),
  ).catch(() => {
    dispatch({
      type: CELL_SETS_ERROR,
      payload: {
        experimentId,
        error: "Couldn't fetch cell sets.",
      },
    });
  });
};

export default loadCellSets;
