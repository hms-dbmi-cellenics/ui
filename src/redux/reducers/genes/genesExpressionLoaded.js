import { initialViewState } from './initialState';

const genesExpressionLoaded = (state, action) => {
  const { data, componentUuid } = action.payload;

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
      loading: [],
      data: {
        ...state.expression.data,
        ...data,
      },
    },
  };
};

export default genesExpressionLoaded;
