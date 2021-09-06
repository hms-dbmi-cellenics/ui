const metaInitialState = {
  loading: false,
  completingStepError: false,
  loadingSettingsError: false,
  selectedConfigureEmbeddingPlot: 'cellCluster',
  changedQCFilters: new Set(),
  navigationPath: '',
};

const initialState = {
  info: {
    experimentId: null,
    experimentName: null,
  },
  processing: {
    meta: metaInitialState,
  },
  originalProcessing: {},
};

export { metaInitialState };
export default initialState;
