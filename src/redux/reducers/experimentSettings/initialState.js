const initialPipelineState = {
  startDate: null,
  endDate: null,
  status: null,
  completedSteps: [],
};

const initialWorkerState = {
  status: null,
  started: false,
  ready: null,
  restartCount: 0,
};

const initialState = {
  backendStatus: {
    loading: false,
    error: false,
    status: {
    },
  },
  info: {
    experimentId: null,
    experimentName: null,
  },
  processing: {
    meta: {
      loading: true,
      completingStepError: false,
      loadingSettingsError: false,
      selectedConfigureEmbeddingPlot: 'cellCluster',
      changedQCFilters: new Set(),
    },
  },
  originalProcessing: {},
};

export default initialState;
export { initialPipelineState, initialWorkerState };
