/* eslint-disable no-param-reassign */
import produce from 'immer';

const differentialExpressionSetAdvFilters = produce((draft, action) => {
  const { advancedFilters } = action.payload;

  draft.comparison.advancedFilters = advancedFilters;
});

export default differentialExpressionSetAdvFilters;
