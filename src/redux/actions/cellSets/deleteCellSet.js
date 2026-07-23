import { CELL_SETS_DELETE } from 'redux/actionTypes/cellSets';

import endUserMessages from 'utils/endUserMessages';
import fetchAPI from 'utils/http/fetchAPI';
import handleError from 'utils/http/handleError';
import loadCellSets from 'redux/actions/cellSets/loadCellSets';

const deleteCellSetJsonMerger = (cellSetKey, cellClasskey) => (
  [{
    $match: {
      query: `$[?(@.key == "${cellClasskey}")]`,
      value: {
        children: [
          {
            $match: {
              query: `$[?(@.key == "${cellSetKey}")]`,
              value: {
                $remove: true,
              },
            },
          },
        ],
      },
    },
  }]
);

const deleteCellSet = (experimentId, key) => async (dispatch, getState) => {
  const {
    loading, error,
  } = getState().cellSets;

  if (loading || error) {
    return null;
  }

  // Optimistically remove the cell set from the UI right away; the API PATCH
  // rewrites the whole cell sets object (slow for large cell sets) so we don't
  // block the UI on it. On failure we reload to restore the server's truth.
  dispatch({
    type: CELL_SETS_DELETE,
    payload: { key },
  });

  try {
    await fetchAPI(
      `/v2/experiments/${experimentId}/cellSets`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/boschni-json-merger+json',
        },
        body: JSON.stringify(
          deleteCellSetJsonMerger(key, 'scratchpad'),
        ),
      },
    );
  } catch (e) {
    handleError(e, endUserMessages.ERROR_SAVING);
    dispatch(loadCellSets(experimentId, true));
  }
};

export default deleteCellSet;
