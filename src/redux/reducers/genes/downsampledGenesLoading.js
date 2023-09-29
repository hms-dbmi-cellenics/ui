/* eslint-disable no-param-reassign */
import produce, { original } from 'immer';
import _ from 'lodash';

import getInitialState from './getInitialState';

const downsampledGenesLoading = produce((draft, action) => {
  const { ETag, genes } = action.payload;

  console.log('ETagweDebug');
  console.log(ETag);
  if (ETag) {
    draft.expression.downsampledETag = ETag;
  }

  if (genes) {
    draft.expression.downsampled.loading = _.union(
      original(draft).expression.downsampled.loading,
      genes,
    );
  }
}, getInitialState());

export default downsampledGenesLoading;
