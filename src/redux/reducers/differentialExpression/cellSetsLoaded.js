/* eslint-disable no-param-reassign */
import produce from 'immer';
import { getCellSetKey } from 'utils/cellSets';

// Options that don't refer to a cell set, so they are always valid
const keysWithoutCellSet = ['all', 'rest', 'background'];

const getKeysInTree = (nodes, keys = new Set()) => {
  if (!nodes) return keys;

  nodes.forEach(({ key, children }) => {
    keys.add(key);
    getKeysInTree(children, keys);
  });

  return keys;
};

// The comparison selections are kept in redux, so they can outlive the cell sets
// they point at: cell sets are replaced wholesale whenever they are (re)loaded,
// e.g. after a reprocess or a re-upload. Clear the selections that no longer
// exist, otherwise the tool shows a comparison that can't be run (and crashes
// when checking whether it can).
const cellSetsLoaded = produce((draft, action) => {
  const keysInTree = getKeysInTree(action.payload.data);

  Object.values(draft.comparison.group).forEach((comparisonGroup) => {
    Object.entries(comparisonGroup).forEach(([comparisonKey, comparisonValue]) => {
      if (!comparisonValue) return;

      const cellSetKey = getCellSetKey(comparisonValue);

      if (Array.isArray(cellSetKey)
        || keysWithoutCellSet.includes(cellSetKey)
        || keysInTree.has(cellSetKey)
      ) return;

      comparisonGroup[comparisonKey] = null;
    });
  });
});

export default cellSetsLoaded;
