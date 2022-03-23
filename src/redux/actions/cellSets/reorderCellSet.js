import { CELL_SETS_REORDER } from 'redux/actionTypes/cellSets';

import fetchAPI from 'utils/http/fetchAPI';
import handleError from 'utils/http/handleError';
import endUserMessages from 'utils/endUserMessages';

const reorderCellSetJsonMerger = (cellSetKey, newPosition, cellClassKey) => (
  [{
    $match: {
      query: `$[?(@.key == "${cellClassKey}")]`,
      value: {
        children: [
          {
            $match: {
              query: `$[?(@.key == "${cellSetKey}")]`,
              value: {
                $move: newPosition,
              },
            },
          },
        ],
      },
    },
  }]
);

const reorderCellSet = (
  experimentId, cellSetKey, newPosition,
) => async (dispatch, getState) => {
  const url = `/v1/experiments/${experimentId}/cellSets`;
  const { parentNodeKey } = getState().cellSets.properties[cellSetKey];

  try {
    await fetchAPI(
      url,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/boschni-json-merger+json',
        },
        body: JSON.stringify(
          reorderCellSetJsonMerger(cellSetKey, newPosition, parentNodeKey),
        ),
      },
      false,
    );

    await dispatch({
      type: CELL_SETS_REORDER,
      payload: {
        cellSetKey,
        newPosition,
        cellClassKey: parentNodeKey,
      },
    });
  } catch (e) {
    handleError(e, endUserMessages.ERROR_SAVING);
  }
};

export default reorderCellSet;
