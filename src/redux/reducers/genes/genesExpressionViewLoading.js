import { initialViewState } from './initialState';

const genesExpressionViewLoading = (state, action) => {
  const { genes, componentUuid } = action.payload;
  return {
    ...state,
    expression: {
      ...state.expression,
      views: {
        ...state.expression.views,
        [componentUuid]: {
          ...initialViewState,
          ...state.expression.views[componentUuid],
          fetching: true,
          error: false,
          data: genes,
        },
      },
    },
  };
};

export default genesExpressionViewLoading;
