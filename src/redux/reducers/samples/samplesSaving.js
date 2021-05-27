const samplesSaving = (state, action) => {
  const { message } = action.payload;

  return {
    ...state,
    meta: {
      ...state.meta,
      saving: message,
      error: false,
    },
  };
};

export default samplesSaving;
