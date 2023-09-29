/* eslint-disable no-param-reassign */
import produce, { original } from 'immer';
import _ from 'lodash';

import getInitialState from './getInitialState';

const downsampledGenesLoading = produce((draft, action) => {
  const { ETag, genes, componentUuid } = action.payload;

  if (ETag) {
    draft.expression.downsampledETag = ETag;
  }

  if (genes) {
    draft.expression.downsampled.loading = _.union(
      original(draft).expression.downsampled.loading,
      genes,
    );
  }

  draft.expression.views[componentUuid].fetching = true;
  draft.expression.views[componentUuid].error = false;
}, getInitialState());

export default downsampledGenesLoading;
