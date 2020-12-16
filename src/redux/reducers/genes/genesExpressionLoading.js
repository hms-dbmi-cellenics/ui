import _ from 'lodash';
import { initialViewState } from './initialState';

const genesExpressionLoading = (state, action) => {
  const { genes, componentUuid } = action.payload;

  console.log('in reducer for expressionLoading', action, state);

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
      loading: _.union(state.expression.loading, genes),
      error: false,
    },
  };
};

export default genesExpressionLoading;
