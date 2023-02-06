const initialState = {
  properties: {},
  hierarchy: [],
  selected: [],
  initialLoadPending: true,
  loading: false,
  error: false,
  updatingCellSets: false,
  hidden: new Set(),
};

export default initialState;
