const initialState = {
  properties: {
    data: [],
    cellSets: {},
    loading: false,
    error: false,
    total: 0,
  },
  comparison: {
    type: 'between',
    group: {
      cellSet: null,
      compareWith: null,
      basis: null,
    },
  },
};

export default initialState;
