import initialState from './initialState';

const projectsSaved = (state) => ({
  ...initialState,
  ...state,
  meta: {
    ...state.meta,
    saving: false,
    error: false,
  },
});

export default projectsSaved;
