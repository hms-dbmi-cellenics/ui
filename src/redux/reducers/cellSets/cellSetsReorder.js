/* eslint-disable no-param-reassign */
import produce from 'immer';

import _ from 'lodash';

const cellSetsReorder = produce((draft, action) => {
  const { cellSetKey, newPosition, cellClassKey } = action.payload;

  const cellClassIndex = draft.hierarchy.findIndex((rootNode) => rootNode.key === cellClassKey);

  const cellClassOrder = draft.hierarchy[cellClassIndex].children;

  // Remove from current position
  _.remove(cellClassOrder, ({ key: currentKey }) => currentKey === cellSetKey);

  // Insert in new position
  cellClassOrder.splice(newPosition, 0, { key: cellSetKey });
});

export default cellSetsReorder;
