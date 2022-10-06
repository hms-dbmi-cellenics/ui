/* eslint-disable no-param-reassign */
import produce from 'immer';

import { calculateZScore } from 'utils/postRequestProcessing';
import initialState from 'redux/reducers/genes/initialState';

const markerGenesLoaded = produce((draft, action) => {
  const { data, genes, plotUuid } = action.payload;
  const dataWithZScore = calculateZScore(data);
  draft.expression.views[plotUuid] = { fetching: false, error: false, data: genes };

  draft.expression.data = { ...draft.expression.data, ...dataWithZScore };

  draft.markers.loading = false;
  draft.markers.error = false;
}, initialState);

export default markerGenesLoaded;
