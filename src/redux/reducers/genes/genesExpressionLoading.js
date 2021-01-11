import _ from 'lodash';
import { initialViewState } from './initialState';

const genesExpressionLoading = (state, action) => {
  const { genes, componentUuid, expressionType } = action.payload;

  return {
    ...state,
    expression: {
      ...state.expression,
      expressionType,
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
      loading: _.union(state.expression.loading, genes),
      error: false,
    },
  };
};

export default genesExpressionLoading;
