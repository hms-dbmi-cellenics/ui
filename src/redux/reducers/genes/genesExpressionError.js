import { initialViewState } from './initialState';

const genesExpressionError = (state, action) => {
  const { error, componentUuid } = action.payload;

  return {
    ...state,
    expression: {
      ...state.expression,
      views: {
        ...state.properties.views,
        [componentUuid]: {
          ...initialViewState,
          ...state.expression.views[componentUuid],
          fetching: false,
          error,
        },
      },
      loading: [],
      error,
    },
  };
};

export default genesExpressionError;
