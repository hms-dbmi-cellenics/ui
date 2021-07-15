import { initialViewState } from './initialState';
import { calculateZScore } from '../../../utils/postRequestProcessing';

const markerGenesLoaded = (state, action) => {
  const { data, genes } = action.payload;

  const dataWithZScore = calculateZScore(data);

  return {
    ...state,
    expression: {
      ...state.expression,
      views: {
        ...state.expression.views,
        interactiveHeatmap: {
          ...initialViewState,
          ...state.expression.views.interactiveHeatmap,
          fetching: false,
          error: false,
          data: genes,
        },
      },
      data: {
        ...state.expression.data,
        ...dataWithZScore,
      },
    },
    markers: {
      ...state.markers,
      loading: false,
      error: false,
    },
  };
};

export default markerGenesLoaded;
