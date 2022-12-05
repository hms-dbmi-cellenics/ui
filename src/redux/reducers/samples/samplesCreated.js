const samplesCreated = (state, action) => {
  const { samples } = action.payload;

  const newState = { ...state };

  samples.forEach((sample) => {
    newState[sample.uuid] = sample;
  });

  return newState;
};

export default samplesCreated;
