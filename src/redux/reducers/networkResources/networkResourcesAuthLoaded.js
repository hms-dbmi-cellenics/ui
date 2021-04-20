const networkResourcesAuthLoaded = (state, action) => {
  const { identityPoolId, userPoolId, userPoolClientId } = action.payload;

  return {
    ...state,
    auth: {
      userPoolId,
      identityPoolId,
      userPoolClientId,
    },
  };
};

export default networkResourcesAuthLoaded;
