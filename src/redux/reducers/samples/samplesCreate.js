const samplesCreate = (state, action) => {
  const { sample } = action.payload;
  return {
    ...state,
    // ids: [...state.ids, sample.uuid],
    [sample.uuid]: sample,
  };
};

export default samplesCreate;
