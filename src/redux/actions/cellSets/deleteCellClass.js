import { CELL_CLASS_DELETE } from 'redux/actionTypes/cellSets';

import endUserMessages from 'utils/endUserMessages';
import fetchAPI from 'utils/http/fetchAPI';
import handleError from 'utils/http/handleError';
import loadCellSets from 'redux/actions/cellSets/loadCellSets';

const deleteCellClassJsonMerger = (cellClasskey) => (
  [{
    $match: {
      query: `$[?(@.key == "${cellClasskey}")]`,
      value: {
        $remove: true,
      },
    },
  }]
);

const deleteCellSet = (
  experimentId,
  cellClassKey,
) => async (dispatch, getState) => {
  const {
    loading, error,
  } = getState().cellSets;

  if (loading || error) {
    return null;
  }

  // Optimistically remove the cell class from the UI right away. The API PATCH
  // rewrites the whole cell sets object (slow for large cell sets), so we don't
  // block the UI on it; on failure we reload to restore the server's truth.
  dispatch({
    type: CELL_CLASS_DELETE,
    payload: { key: cellClassKey },
  });

  try {
    await fetchAPI(
      `/v2/experiments/${experimentId}/cellSets`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/boschni-json-merger+json',
        },
        body: JSON.stringify(deleteCellClassJsonMerger(cellClassKey)),
      },
    );
  } catch (e) {
    handleError(e, endUserMessages.ERROR_SAVING);
    dispatch(loadCellSets(experimentId, true));
  }
};

export default deleteCellSet;
