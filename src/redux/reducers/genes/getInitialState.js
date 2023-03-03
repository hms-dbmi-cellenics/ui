import ExpressionMatrix from 'utils/expression/ExpressionMatrix/ExpressionMatrix';

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
    downsampledHeatmapSettings: [],
    downsampledCellOrder: [],
    views: {},
  },
  selected: [],
  focused: undefined,
  markers: {
    loading: false,
    error: false,
  },
});

export { initialViewState };
export default getInitialState;
