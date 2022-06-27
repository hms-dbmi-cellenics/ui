import { v4 as uuidv4 } from 'uuid';

import fetchAPI from 'utils/http/fetchAPI';

import { CELL_SETS_CREATE } from 'redux/actionTypes/cellSets';

import endUserMessages from 'utils/endUserMessages';
import pushNotificationMessage from 'utils/pushNotificationMessage';
import handleError from 'utils/http/handleError';

const createCellSetJsonMerger = (newCellSet, cellClassKey) => (
  [{
    $match: {
      query: `$[?(@.key == "${cellClassKey}")]`,
      value: {
        children: [
          {
            $insert: {
              index: '-',
              value: newCellSet,
            },
          },
        ],
      },
    },
  }]
);

const createCellSet = (experimentId, name, color, cellIdsSet) => async (dispatch, getState) => {
  const {
    loading, error,
  } = getState().cellSets;

  if (loading || error) {
    return null;
  }

  const data = {
    key: uuidv4(),
    name,
    color,
    type: 'cellSets',
  };

  // cellIds are stored as an integer set in redux, so we need to convert it
  const dataForRedux = {
    ...data,
    cellIds: cellIdsSet,
  };

  // cellIds are stored as an array in S3
  const dataForUpload = {
    ...data,
    cellIds: Array.from(cellIdsSet),
  };

  if (dataForRedux.cellIds.size === 0) {
    pushNotificationMessage('info', endUserMessages.EMPTY_CLUSTER_NOT_CREATED);
    return;
  }

  dispatch({
    type: CELL_SETS_CREATE,
    payload: dataForRedux,
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
          createCellSetJsonMerger(dataForUpload, 'scratchpad'),
        ),
      },
    );

    pushNotificationMessage('info', endUserMessages.SUCCESS_NEW_CLUSTER_CREATED);
  } catch (e) {
    handleError(e, endUserMessages.ERROR_SAVING);
  }
};

export default createCellSet;
