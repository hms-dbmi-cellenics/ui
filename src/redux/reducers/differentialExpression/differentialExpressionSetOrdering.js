/* eslint-disable no-param-reassign */
import produce from 'immer';

import initialState from 'redux/reducers/differentialExpression/initialState';

const differentialExpressionSetGeneOrdering = produce((draft, action) => {
  const { orderBy, orderDirection } = action.payload;

  draft.comparison.ordering = {
    orderBy,
    orderDirection,
  };
}, initialState);

export default differentialExpressionSetGeneOrdering;
