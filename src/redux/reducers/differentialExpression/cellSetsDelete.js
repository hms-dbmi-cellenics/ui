/* eslint-disable no-param-reassign */
import produce from 'immer';
import { getCellSetKey } from 'utils/cellSets';

const cellSetsDelete = produce((draft, action) => {
  const { key: deletedKey } = action.payload;

  Object.values(draft.comparison.group).forEach((comparisonGroup) => {
    Object.entries(comparisonGroup).forEach(([comparisonKey, comparisonValue]) => {
      if (getCellSetKey(comparisonValue) !== deletedKey) return;
      comparisonGroup[comparisonKey] = null;
    });
  });
});

export default cellSetsDelete;
