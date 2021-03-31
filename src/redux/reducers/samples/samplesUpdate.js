const samplesUpdate = (state, action) => {
  const { sampleUuid, sample } = action.payload;
  return {
    ...state,
    [sampleUuid]: {
      ...state[sampleUuid],
      ...sample,
    },
  };
};

export default samplesUpdate;
