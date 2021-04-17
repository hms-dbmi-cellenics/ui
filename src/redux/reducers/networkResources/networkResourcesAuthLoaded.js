const networkResourcesAuthLoaded = (state, action) => {
  const { identityPoolId, userPoolId } = action.payload;

  return {
    ...state,
    auth: {
      userPoolId,
      identityPoolId,
    },
  };
};

export default networkResourcesAuthLoaded;
