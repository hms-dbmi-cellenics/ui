import _ from 'lodash';
import { initialViewState } from './getInitialState';

const genesExpressionLoading = (state, action) => {
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
        },
      },
      full: {
        ...state.expression.full,
        loading: _.union(state.expression.full.loading, genes),
      },
      error: false,
    },
  };
};

export default genesExpressionLoading;
