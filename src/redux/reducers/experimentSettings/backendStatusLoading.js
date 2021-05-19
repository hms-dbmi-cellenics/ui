import initialState from './initialState';

const backendStatusLoading = (state) => ({
  ...initialState,
  ...state,
  backendStatus: {
    ...initialState.backendStatus,
    ...state.backendStatus,
    loading: true,
    error: false,
  },
});

export default backendStatusLoading;
