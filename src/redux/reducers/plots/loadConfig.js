const loadConfig = (state, action) => {
  const { plotUuid, ...rest } = action.payload;

  return {
    ...state,
    [plotUuid]: {
      ...state[plotUuid],
      ...rest,
    },
  };
};

export default loadConfig;
