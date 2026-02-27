/* eslint-disable no-param-reassign */
import produce, { original } from 'immer';
import _ from 'lodash';

import getInitialState, { initialViewState } from 'redux/reducers/genes/getInitialState';

const downsampledGenesLoading = produce((draft, action) => {
  const { ETag, genes, componentUuid } = action.payload;

  // Always update ETag, even if null (for deduplication logic)
  draft.expression.full.ETag = ETag;

  if (genes) {
    draft.expression.downsampled.loading = _.union(
      original(draft).expression.downsampled.loading,
      genes,
    );
  }

  // If the view hasn't stored properties yet, then set initial state
  if (_.isNil(draft.expression.views[componentUuid])) {
    draft.expression.views[componentUuid] = initialViewState;
  }

  draft.expression.views[componentUuid].fetching = true;
  draft.expression.views[componentUuid].error = false;

  // Update the view's data to reflect the genes being loaded
  // This ensures selectedGenes selector reflects the new genes immediately,
  // preventing re-triggers when the loaded action updates it to the same value
  if (genes) {
    draft.expression.views[componentUuid].data = genes;
  }
}, getInitialState());

export default downsampledGenesLoading;
