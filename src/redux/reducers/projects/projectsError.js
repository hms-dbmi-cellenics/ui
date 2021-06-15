import initialState from './initialState';

const projectsError = (state, action) => {
  const { error } = action.payload;
  return {
    ...initialState,
    ...state,
    meta: {
      ...state.meta,
      saving: false,
      error,
    },
  };
};

export default projectsError;
