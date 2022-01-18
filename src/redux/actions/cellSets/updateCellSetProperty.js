import { CELL_SETS_UPDATE_PROPERTY } from 'redux/actionTypes/cellSets';

import fetchAPI from 'utils/fetchAPI';
import endUserMessages from 'utils/endUserMessages';
import pushNotificationMessage from 'utils/pushNotificationMessage';
import { isServerError, throwIfRequestFailed } from 'utils/fetchErrors';

const updatePropertyJsonMerger = (cellSetKey, dataUpdated, cellClassKey) => (
  [{
    $match: {
      query: `$[?(@.key == "${cellClassKey}")]`,
      value: {
        children: [
          {
            $match: {
              query: `$[?(@.key == "${cellSetKey}")]`,
              value: { ...dataUpdated },
            },
          },
        ],
      },
    },
  }]
);

const updateCellSetProperty = (
  experimentId, cellSetKey, dataUpdated,
) => async (dispatch, getState) => {
  const {
    loading, error, properties,
  } = getState().cellSets;

  const { parentNodeKey } = properties[cellSetKey];

  if (loading || error) {
    return null;
  }

  const url = `/v1/experiments/${experimentId}/cellSets`;

  try {
    const response = await fetchAPI(
      url,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/boschni-json-merger+json',
        },
        body: JSON.stringify(
          updatePropertyJsonMerger(cellSetKey, dataUpdated, parentNodeKey),
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
    type: CELL_SETS_UPDATE_PROPERTY,
    payload: {
      experimentId,
      cellSetKey,
      dataUpdated,
    },
  });
};

export default updateCellSetProperty;
