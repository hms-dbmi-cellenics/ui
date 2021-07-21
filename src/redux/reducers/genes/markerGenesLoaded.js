/* eslint-disable no-param-reassign */
import produce, { current } from 'immer';

import initialState from './initialState';

import { calculateZScore } from '../../../utils/postRequestProcessing';

const markerGenesLoaded = produce((draft, action) => {
  const { data, genes } = action.payload;

  const dataWithZScore = calculateZScore(data);

  draft.expression.views.interactiveHeatmap.fetching = false;
  draft.expression.views.interactiveHeatmap.error = false;
  draft.expression.views.interactiveHeatmap.data = genes;

  draft.expression.data = { ...current(draft.expression.data), ...dataWithZScore };

  draft.markers.loading = false;
  draft.markers.error = false;
}, initialState);

export default markerGenesLoaded;
