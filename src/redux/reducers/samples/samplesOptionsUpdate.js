const samplesOptionsUpdate = (state, action) => {
  const { sampleUuids, diff } = action.payload;

  const newSamples = sampleUuids.reduce((acc, sampleUuid) => {
    acc[sampleUuid] = {
      ...state[sampleUuid],
      options: {
        ...state[sampleUuid].options,
        ...diff,
      },
    };

    return acc;
  }, {});

  return {
    ...state,
    ...newSamples,
    meta: {
      ...state.meta,
      saving: false,
    },
  };
};

export default samplesOptionsUpdate;
