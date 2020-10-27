const loadConfig = (state, action) => {
  const { plotUuid, ...rest } = action.payload;
  console.log('LOAD CONFIG  - ', action.payload);
  return {
    ...state,
    [plotUuid]: {
      ...state[plotUuid],
      ...rest,
      outstandingChanges: false,
    },
  };
};

export default loadConfig;
