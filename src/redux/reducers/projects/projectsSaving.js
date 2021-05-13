import initialState from './initialState';

const projectsSaving = (state, action) => {
  const { message } = action.payload;

  return {
    ...initialState,
    ...state,
    meta: {
      ...state.meta,
      saving: message,
      error: false,
    },
  };
};

export default projectsSaving;
