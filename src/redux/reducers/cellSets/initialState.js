const initialState = {
  properties: {},
  hierarchy: [],
  selected: {},
  initialLoadPending: true,
  loading: false,
  error: false,
  updatingClustering: false,
  hidden: new Set(),
};

export default initialState;
