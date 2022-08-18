import { CELL_SETS_REORDER } from 'redux/actionTypes/cellSets';
import fetchAPI from 'utils/http/fetchAPI';
import handleError from 'utils/http/handleError';
import endUserMessages from 'utils/endUserMessages';
import { arrayMoveImmutable } from 'utils/array-move';
import { reorderSamples } from '../experiments';

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

  try {
    await fetchAPI(
      `/v2/experiments/${experimentId}/cellSets`,
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
    if (parentNodeKey === 'sample') {
      const currentOrder = getState().experimentSettings.info.sampleIds;
      const oldPosition = currentOrder.indexOf(cellSetKey);

      const theNewOrder = arrayMoveImmutable(currentOrder, oldPosition, newPosition);
      await dispatch(reorderSamples(experimentId, oldPosition, newPosition, theNewOrder));
    }
  } catch (e) {
    handleError(e, endUserMessages.ERROR_SAVING);
  }
};

export default reorderCellSet;
