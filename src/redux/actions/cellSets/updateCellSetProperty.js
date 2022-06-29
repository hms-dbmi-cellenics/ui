import _ from 'lodash';

import { CELL_SETS_UPDATE_PROPERTY } from 'redux/actionTypes/cellSets';

import fetchAPI from 'utils/http/fetchAPI';
import endUserMessages from 'utils/endUserMessages';
import handleError from 'utils/http/handleError';

const updateCellSetPropertyJsonMerger = (cellSetKey, dataUpdated, cellClassKey) => (
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

const updateCellClassPropertyJsonMerger = (cellClassKey, dataUpdated) => (
  [{
    $match: {
      query: `$[?(@.key == "${cellClassKey}")]`,
      value: { ...dataUpdated },
    },
  }]
);

const cellClassAllowedKeys = ['name'];
const cellSetAllowedKeys = ['name', 'color'];

const updatesAreAllowed = (dataUpdated, rootNode) => {
  const allowedPropertyKeys = rootNode ? cellClassAllowedKeys : cellSetAllowedKeys;

  const dataUpdatedKeys = Object.keys(dataUpdated);

  return _.intersection(dataUpdatedKeys, allowedPropertyKeys).length === dataUpdatedKeys.length;
};

const updateCellSetProperty = (
  experimentId, key, dataUpdated,
) => async (dispatch, getState) => {
  const { loading, error, properties } = getState().cellSets;

  if (loading || error) {
    return null;
  }

  const { parentNodeKey, rootNode } = properties[key];

  if (!updatesAreAllowed(dataUpdated, rootNode)) {
    throw new Error('Invalid cell set update');
  }

  const jsonMergerUpdateObject = rootNode
    ? updateCellClassPropertyJsonMerger(key, dataUpdated)
    : updateCellSetPropertyJsonMerger(key, dataUpdated, parentNodeKey);

  try {
    await fetchAPI(
      `/v2/experiments/${experimentId}/cellSets`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/boschni-json-merger+json',
        },
        body: JSON.stringify(jsonMergerUpdateObject),
      },
    );

    await dispatch({
      type: CELL_SETS_UPDATE_PROPERTY,
      payload: {
        cellSetKey: key,
        dataUpdated,
      },
    });
  } catch (e) {
    handleError(e, endUserMessages.ERROR_SAVING);
  }
};

export default updateCellSetProperty;
