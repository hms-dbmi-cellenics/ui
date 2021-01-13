const initialViewState = {
  fetching: false,
  error: false,
  data: [],
};

const initialExpressionState = {
  min: 0,
  max: 0,
  expression: [],
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
    expressionType: 'raw',
  },
  selected: [],
  focused: undefined,
};

export { initialViewState, initialExpressionState };
export default initialState;
