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
      loading: _.difference(state.properties.loading, genes),
      error,
    },
  };
};

export default genesExpressionError;
