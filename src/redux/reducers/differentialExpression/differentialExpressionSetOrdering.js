/* eslint-disable no-param-reassign */
import produce from 'immer';

import initialState from './initialState';

const differentialExpressionSetOrdering = produce((draft, action) => {
  const { orderBy, orderDirection } = action.payload;

  draft.ordering = {
    orderBy,
    orderDirection,
  };
}, initialState);

export default differentialExpressionSetOrdering;
