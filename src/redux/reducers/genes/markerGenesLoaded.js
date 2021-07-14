import { initialViewState } from './initialState';

const markerGenesLoaded = (state, action) => {
  const { data, genes } = action.payload;

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
        ...data,
      },
    },
    markers: {
      ...state.markers,
      markersNeedToBeLoaded: false,
      markersError: false,
    },
  };
};

export default markerGenesLoaded;
