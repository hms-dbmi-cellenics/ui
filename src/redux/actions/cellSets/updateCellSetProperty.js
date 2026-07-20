import _ from 'lodash';

import { CELL_SETS_UPDATE_PROPERTY } from 'redux/actionTypes/cellSets';

import fetchAPI from 'utils/http/fetchAPI';
import endUserMessages from 'utils/endUserMessages';
import handleError from 'utils/http/handleError';
import loadCellSets from 'redux/actions/cellSets/loadCellSets';

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

  // Optimistically update the UI (e.g. the new name/color) right away; the API
  // PATCH rewrites the whole cell sets object so we don't block the UI on it.
  // On failure we reload to restore the server's truth.
  dispatch({
    type: CELL_SETS_UPDATE_PROPERTY,
    payload: {
      cellSetKey: key,
      dataUpdated,
    },
  });

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
  } catch (e) {
    handleError(e, endUserMessages.ERROR_SAVING);
    dispatch(loadCellSets(experimentId, true));
  }
};

export default updateCellSetProperty;
