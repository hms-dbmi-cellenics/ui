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
    ordering: {
      orderBy: 'logFC',
      orderDirection: 'DESC',
    },
  },
};

export default initialState;
