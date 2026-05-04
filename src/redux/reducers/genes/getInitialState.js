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
