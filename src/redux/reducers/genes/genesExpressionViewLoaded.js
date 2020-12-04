import { initialViewState } from './initialState';

const genesExpressionViewLoaded = (state, action) => {
  const { componentUuid } = action.payload;

  return {
    ...state,
    expression: {
      ...state.expression,
      views: {
        ...state.expression.views,
        [componentUuid]: {
          ...initialViewState,
          ...state.expression.views[componentUuid],
          fetching: false,
          error: false,
        },
      },
    },
  };
};

export default genesExpressionViewLoaded;
