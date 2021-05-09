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
  pipelineStatus: {
    loading: false,
    error: false,
    status: {
    },
  },
  info: {
    experimentId: null,
    experimentName: null,
    projectId: null,
    createdAt: null,
    lastViewed: null,
  },
  processing: {
    meta: {
      loading: true,
      completingStepError: false,
      loadingSettingsError: false,
      selectedConfigureEmbeddingPlot: 'sample',
    },
  },
};

export default initialState;
export { initialPipelineState, initialWorkerState };
