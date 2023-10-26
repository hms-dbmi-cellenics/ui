import _ from 'lodash';
import { initialViewState } from './getInitialState';

const genesExpressionError = (state, action) => {
  const { error, componentUuid, genes } = action.payload;

  return {
    ...state,
    expression: {
      ...state.expression,
      views: {
        ...state.properties.views,
        [componentUuid]: {
          ...initialViewState,
          ...state.expression.views[componentUuid],
          fetching: false,
          error,
        },
      },
      full: {
        ...state.expression.full,
        loading: _.difference(state.expression.full.loading, genes),
        error,
      },
    },
  };
};

export default genesExpressionError;
