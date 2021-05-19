import initialState from './initialState';

const samplesSaved = (state) => ({
  ...initialState,
  ...state,
  meta: {
    ...state.meta,
    saving: false,
  },
});

export default samplesSaved;
