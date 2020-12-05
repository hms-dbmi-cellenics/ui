import { initialViewState } from './initialState';

const genesPropertiesError = (state, action) => {
  const {
    componentUuid, error,
  } = action.payload;

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
          error,
        },
      },
    },
  };
};

export default genesPropertiesError;
