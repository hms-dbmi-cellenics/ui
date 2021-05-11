import initialState from './initialState';

const samplesSaving = (state) => ({
  ...initialState,
  ...state,
  meta: {
    ...state.meta,
    saving: true,
    error: false,
  },
});

export default samplesSaving;
