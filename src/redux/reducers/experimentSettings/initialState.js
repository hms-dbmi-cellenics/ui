const metaInitialState = {
  loading: false,
  completingStepError: false,
  loadingSettingsError: false,
  selectedConfigureEmbeddingPlot: 'cellCluster',
  changedQCFilters: new Set(),
};

const initialState = {
  info: {
    experimentId: null,
    experimentName: null,
    sampleIds: [],
    paramsHash: '',
  },
  processing: {
    meta: metaInitialState,
  },
  originalProcessing: {},
};

export { metaInitialState };
export default initialState;
