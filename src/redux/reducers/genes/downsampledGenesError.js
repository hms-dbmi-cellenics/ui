/* eslint-disable no-param-reassign */
import produce, { original } from 'immer';

import _ from 'lodash';

const downsampledGenesError = produce((draft, action) => {
  const { error, componentUuid, genes } = action.payload;

  const previousLoadingGenes = original(draft.expression.downsampled.loading);
  const previousFullLoadingGenes = original(draft.expression.full.loading);

  draft.expression.views[componentUuid].fetching = false;
  draft.expression.views[componentUuid].error = error;

  draft.expression.downsampled.error = error;
  draft.expression.downsampled.loading = _.difference(previousLoadingGenes, genes);

  // Also remove from full.loading to avoid blocking other gene loads
  draft.expression.full.loading = _.difference(previousFullLoadingGenes, genes);
});

export default downsampledGenesError;
