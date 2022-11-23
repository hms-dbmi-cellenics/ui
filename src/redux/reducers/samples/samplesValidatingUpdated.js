const samplesValidatingUpdated = (state, action) => {
  const { validating } = action.payload;

  return {
    ...state,
    meta: {
      ...state.meta,
      validating,
    },
  };
};

export default samplesValidatingUpdated;
