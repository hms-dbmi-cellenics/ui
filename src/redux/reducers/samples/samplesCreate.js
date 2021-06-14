const samplesCreate = (state, action) => {
  const { sample } = action.payload;
  return {
    ...state,
    [sample.uuid]: sample,
  };
};

export default samplesCreate;
