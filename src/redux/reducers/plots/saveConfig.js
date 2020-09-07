const saveConfig = (state, action) => {
  const { plotUuid, lastUpdated } = action.payload;

  return {
    ...state,
    [plotUuid]: {
      ...state[plotUuid],
      lastUpdated,
      outstandingChanges: false,
    },
  };
};

export default saveConfig;
