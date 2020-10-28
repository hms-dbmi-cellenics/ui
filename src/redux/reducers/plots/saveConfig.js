const saveConfig = (state, action) => {
  const { plotUuid, lastUpdated } = action.payload;
  console.log('LAST UPDATED', lastUpdated);
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
