import initialState from './initialState';

const samplesSaved = (state) => ({
  ...initialState,
  ...state,
  meta: {
    ...state.meta,
    saving: false,
    error: false,
  },
});

export default samplesSaved;
