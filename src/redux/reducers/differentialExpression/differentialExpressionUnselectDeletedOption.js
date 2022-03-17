/* eslint-disable no-param-reassign */
import produce from 'immer';
import { getCellSetKey } from 'utils/cellSets';

const differentialExpressionUnselectDeletedOption = produce((draft, action) => {
  const { key: deletedKey } = action.payload;

  Object.keys(draft.comparison.group).forEach((comparisonType) => {
    const comparisonGroup = draft.comparison.group[comparisonType];

    Object.keys(comparisonGroup).forEach((comparisonKey) => {
      if (getCellSetKey(comparisonGroup[comparisonKey]) !== deletedKey) return;
      comparisonGroup[comparisonKey] = null;
    });
  });
});

export default differentialExpressionUnselectDeletedOption;
