const samplesLoad = (state, action) => {
  const { samples } = action.payload;

  return {
    ...state,
    meta: {
      ...state.meta,
      loading: false,
      error: false,
    },
    ...samples,
  };
};

export default samplesLoad;
