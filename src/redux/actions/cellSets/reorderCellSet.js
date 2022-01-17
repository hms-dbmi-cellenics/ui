import fetchAPI from 'utils/fetchAPI';

import { CELL_SETS_REORDER } from 'redux/actionTypes/cellSets';

import endUserMessages from 'utils/endUserMessages';
import pushNotificationMessage from 'utils/pushNotificationMessage';
import { isServerError, throwIfRequestFailed } from 'utils/fetchErrors';

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
    const response = await fetchAPI(
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
    );

    const json = await response.json();
    throwIfRequestFailed(response, json, endUserMessages.ERROR_SAVING);
  } catch (e) {
    if (!isServerError(e)) {
      console.error(`fetch ${url} error ${e.message}`);
    }

    pushNotificationMessage('error', endUserMessages.ERROR_SAVING);
  }

  await dispatch({
    type: CELL_SETS_REORDER,
    payload: {
      experimentId,
      cellSetKey,
      newPosition,
      cellClassKey: parentNodeKey,
    },
  });
};

export default reorderCellSet;
