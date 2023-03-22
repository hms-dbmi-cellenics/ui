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
    loading: [],
    error: false,
    matrix: new ExpressionMatrix(),
    downsampledMatrix: new ExpressionMatrix(),
    downsampledCellOrder: [],
    views: {},
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
