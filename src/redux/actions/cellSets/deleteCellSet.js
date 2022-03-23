import { CELL_SETS_DELETE } from 'redux/actionTypes/cellSets';

import endUserMessages from 'utils/endUserMessages';
import fetchAPI from 'utils/http/fetchAPI';
import handleError from 'utils/http/handleError';

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

  const url = `/v1/experiments/${experimentId}/cellSets`;

  try {
    await fetchAPI(
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

    await dispatch({
      type: CELL_SETS_DELETE,
      payload: { key },
    });
  } catch (e) {
    handleError(e, endUserMessages.ERROR_SAVING);
  }
};

export default deleteCellSet;
