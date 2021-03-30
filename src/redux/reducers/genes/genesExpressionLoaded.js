import _ from 'lodash';
import { initialViewState } from './initialState';

const genesExpressionLoaded = (state, action) => {
  const lowerCaseArray = (array) => (array.map((element) => element.toLowerCase()));
  const {
    data, componentUuid, genes,
    loadingStatus = _.difference(lowerCaseArray(state.expression.loading), lowerCaseArray(genes)),
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
          error: false,
          data: genes,
        },
      },
      data: {
        ...state.expression.data,
        ...data,
      },
      loading: loadingStatus,
    },
  };
};

export default genesExpressionLoaded;
