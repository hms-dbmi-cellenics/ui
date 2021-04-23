const networkResourcesLoadEnvironment = (state, action) => {
  const { environment } = action.payload;

  return {
    ...state,
    environment,
  };
};

export default networkResourcesLoadEnvironment;
