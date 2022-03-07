const metaInitialState = {
  loading: false,
  completingStepError: false,
  loadingSettingsError: false,
  changedQCFilters: new Set(),
};

const initialState = {
  info: {
    experimentId: null,
    experimentName: null,
    sampleIds: [],
  },
  processing: {
    meta: metaInitialState,
  },
  originalProcessing: {},
};

export { metaInitialState };
export default initialState;
