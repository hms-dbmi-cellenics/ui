import initialState from './initialState';

const projectsSaved = (state) => ({
  ...initialState,
  ...state,
  meta: {
    ...state.meta,
    saving: false,
  },
});

export default projectsSaved;
