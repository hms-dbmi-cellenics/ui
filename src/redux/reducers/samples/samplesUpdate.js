const samplesUpdate = (state, action) => {
  const { sampleUuid, sample } = action.payload;

  return {
    ...state,
    [sampleUuid]: {
      ...state[sampleUuid],
      ...sample,
      metadata: {
        ...state[sampleUuid]?.metadata || {},
        ...sample?.metadata || {},
      },
    },
  };
};

export default samplesUpdate;
