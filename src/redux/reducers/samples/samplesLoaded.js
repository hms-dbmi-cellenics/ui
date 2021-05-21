const samplesLoad = (state, action) => {
  const { samples } = action.payload;
  return {
    ...state,
    loading: false,
    meta: {
      ...state.meta,
      loading: false,
      error: false,
    },
    ...samples,
    ids: [...state.ids, ...samples.ids],
  };
};

export default samplesLoad;
