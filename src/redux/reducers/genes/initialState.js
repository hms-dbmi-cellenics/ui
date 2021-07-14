const initialViewState = {
  fetching: false,
  error: false,
  data: [],
};

const initialExpressionState = {
  min: 0,
  max: 0,
  mean: 0,
  stdev: 0,
  expression: [],
  zScore: [],
};

const initialState = {
  properties: {
    loading: [],
    views: {},
    data: {},
  },
  expression: {
    loading: [],
    error: false,
    data: {},
    views: {},
  },
  selected: [],
  focused: undefined,
  markers: {
    loading: true,
    error: false,
    order: null,
  },
};

export { initialViewState, initialExpressionState };
export default initialState;
