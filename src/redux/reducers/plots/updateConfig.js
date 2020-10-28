const updateConfig = (state, action) => {
  const { plotUuid, configChange } = action.payload;
  console.log('CONFIG CHANGE', configChange);
  console.log('STATE IS', state);
  console.log('ACTION IS ', action);
  return {
    ...state,
    [plotUuid]: {
      ...state[plotUuid],
      config: { ...state[plotUuid].config, ...configChange },
      outstandingChanges: true,
    },
  };
};

export default updateConfig;
