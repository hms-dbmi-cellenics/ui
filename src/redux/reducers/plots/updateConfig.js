const updateConfig = (state, action) => {
  const { plotUuid, configChange } = action.payload;

  return {
    ...state,
    [plotUuid]: {
      ...state[plotUuid],
      config: { ...state[plotUuid].config, ...configChange },
    },
  };
};

export default updateConfig;
