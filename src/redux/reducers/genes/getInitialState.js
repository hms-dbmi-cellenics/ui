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
      ETag: null,
      matrix: new ExpressionMatrix(),
    },
    downsampled: {
      loading: [],
      error: false,
      matrix: new ExpressionMatrix(),
      cellOrder: [],
      cellOrderUpdating: false,
      cellOrderSelectedPoints: null, // Track which selectedPoints cellOrder was computed for
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
