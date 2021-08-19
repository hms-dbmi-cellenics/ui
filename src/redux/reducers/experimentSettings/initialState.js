const initialState = {
  info: {
    experimentId: null,
    experimentName: null,
  },
  processing: {
    meta: {
      loading: false,
      completingStepError: false,
      loadingSettingsError: false,
      selectedConfigureEmbeddingPlot: 'cellCluster',
      changedQCFilters: new Set(),
    },
  },
  originalProcessing: {},
};

export default initialState;
