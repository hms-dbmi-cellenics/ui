import { CELL_SETS_REORDER } from 'redux/actionTypes/cellSets';

import fetchAPI from 'utils/http/fetchAPI';
import handleError from 'utils/http/handleError';
import endUserMessages from 'utils/endUserMessages';

import config from 'config';
import { api } from 'utils/constants';

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
  const { parentNodeKey } = getState().cellSets.properties[cellSetKey];

  let url;

  if (config.currentApiVersion === api.V1) {
    url = `/v1/experiments/${experimentId}/cellSets`;
  } else if (config.currentApiVersion === api.V2) {
    url = `/v2/experiments/${experimentId}/cellSets`;
  }

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
