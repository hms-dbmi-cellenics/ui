const initialState = {
  properties: {
    data: [],
    cellSets: {},
    comparisonType: null,
    loading: false,
    error: false,
    total: 0,
  },
  comparison: {
    type: 'within',
    advancedFilters: [],
    group: {
      between: {
        cellSet: null,
        compareWith: null,
        basis: null,
      },
      within: {
        cellSet: null,
        compareWith: null,
        basis: null,
      },
    },
  },
};

export default initialState;
