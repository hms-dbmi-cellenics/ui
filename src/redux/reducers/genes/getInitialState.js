import ExpressionMatrix from 'utils/ExpressionMatrix/ExpressionMatrix';

const initialViewState = {
  fetching: false,
  error: false,
  data: [],
};

const getInitialState = () => ({
  properties: {
    loading: [],
    views: {},
    data: {},
  },
  expression: {
    views: {},
    full: {
      loading: [],
      error: false,
      matrix: new ExpressionMatrix(),
    },
    downsampled: {
      loading: [],
      error: false,
      matrix: new ExpressionMatrix(),
      cellOrder: [],
      ETag: null,
    },
  },
  selected: [],
  focused: undefined,
  markers: {
    loading: false,
    error: false,
    ETag: null,
  },
});

export { initialViewState };
export default getInitialState;
