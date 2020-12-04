import { initialViewState } from './initialState';

const genesExpressionLoading = (state, action) => {
  const { genes, componentUuid } = action.payload;

  if (componentUuid !== null) {
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
        loading: genes,
        error: false,
      },
    };
  }
  return {
    ...state,
    expression: {
      ...state.expression,
      loading: genes,
      error: false,
    },
  };
};

export default genesExpressionLoading;
