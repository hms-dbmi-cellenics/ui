/* eslint-disable no-param-reassign */
import produce, { original } from 'immer';
import _ from 'lodash';

import getInitialState, { initialViewState } from 'redux/reducers/genes/getInitialState';

const downsampledGenesLoading = produce((draft, action) => {
  const { ETag, genes, componentUuid } = action.payload;

  if (ETag) {
    draft.expression.downsampled.ETag = ETag;
  }

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
}, getInitialState());

export default downsampledGenesLoading;
