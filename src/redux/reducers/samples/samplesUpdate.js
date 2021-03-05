const samplesUpdate = (state, action) => {
  const { project: sample } = action.payload;
  return {
    ...state,
    [sample.uuid]: sample,
  };
};

export default samplesUpdate;
