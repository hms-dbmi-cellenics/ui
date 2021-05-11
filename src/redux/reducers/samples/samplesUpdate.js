const samplesUpdate = (state, action) => {
  const { sampleUuid, diff } = action.payload;
  return {
    ...state,
    [sampleUuid]: {
      ...state[sampleUuid],
      ...diff,
    },
  };
};

export default samplesUpdate;
