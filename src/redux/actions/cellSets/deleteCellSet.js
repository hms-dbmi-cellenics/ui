import { CELL_SETS_DELETE } from 'redux/actionTypes/cellSets';

import { isServerError, throwIfRequestFailed } from 'utils/fetchErrors';
import pushNotificationMessage from 'utils/pushNotificationMessage';
import endUserMessages from 'utils/endUserMessages';
import fetchAPI from 'utils/fetchAPI';

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

  await dispatch({
    type: CELL_SETS_DELETE,
    payload: {
      experimentId,
      key,
    },
  });

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
          deleteCellSetJsonMerger(key, 'scratchpad'),
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
};

export default deleteCellSet;
