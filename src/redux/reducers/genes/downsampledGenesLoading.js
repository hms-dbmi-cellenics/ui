/* eslint-disable no-param-reassign */
import produce from 'immer';

import getInitialState from './getInitialState';

const downsampledGenesLoading = produce((draft, action) => {
  const { ETag } = action.payload;

  draft.expression.downsampledETag = ETag;
}, getInitialState());

export default downsampledGenesLoading;
