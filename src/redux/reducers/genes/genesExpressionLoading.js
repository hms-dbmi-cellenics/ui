import { initialViewState } from './initialState';

const genesExpressionLoading = (state, action) => {
  const { genes, componentUuid } = action.payload;

  console.log('fetching is being set to true');
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
          data: [...genes],
        },
      },
      loading: [...genes],
      error: false,
    },
  };
};

export default genesExpressionLoading;
