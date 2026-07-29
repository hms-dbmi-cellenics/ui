/* eslint-disable no-param-reassign */
import produce from 'immer';
import { getCellSetClassKey } from 'utils/cellSets';

// Deleting a cell class deletes all the cell sets under it, so any comparison
// selected from it is left pointing at a cell set that no longer exists.
const cellClassDelete = produce((draft, action) => {
  const { key: deletedClassKey } = action.payload;

  Object.values(draft.comparison.group).forEach((comparisonGroup) => {
    Object.entries(comparisonGroup).forEach(([comparisonKey, comparisonValue]) => {
      if (getCellSetClassKey(comparisonValue) !== deletedClassKey) return;
      comparisonGroup[comparisonKey] = null;
    });
  });
});

export default cellClassDelete;
