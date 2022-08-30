/* eslint-disable no-param-reassign */
import produce from 'immer';

import { arrayMoveMutable } from 'utils/array-move';

const cellSetsReorder = produce((draft, action) => {
  const { cellSetKey, newPosition, cellClassKey } = action.payload;

  const cellClassIndex = draft.hierarchy.findIndex((rootNode) => rootNode.key === cellClassKey);

  const cellClassOrder = draft.hierarchy[cellClassIndex].children;

  const currentPosition = cellClassOrder.findIndex((cellSet) => cellSet.key === cellSetKey);
  arrayMoveMutable(cellClassOrder, currentPosition, newPosition);
});

export default cellSetsReorder;
