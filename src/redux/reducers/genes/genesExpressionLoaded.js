import _ from 'lodash';
import { initialViewState } from './initialState';

const genesExpressionLoaded = (state, action) => {
  const {
    data, componentUuid, genes, expressionType,
  } = action.payload;

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
          fetching: false,
          error: false,
        },
      },
      data: {
        ...state.expression.data,
        ...data,
      },
      loading: _.difference(state.expression.loading, genes),
    },
  };
};

export default genesExpressionLoaded;
