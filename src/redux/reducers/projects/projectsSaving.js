import initialState from './initialState';

const projectsSaving = (state) => ({
  ...initialState,
  ...state,
  meta: {
    ...state.meta,
    saving: true,
    error: false,
  },
});

export default projectsSaving;
