const networkResourcesAuthLoaded = (state, action) => {
  const { identityPoolId, userPoolId, userPoolClientDetails } = action.payload;

  return {
    ...state,
    auth: {
      userPoolId,
      identityPoolId,
      userPoolClientDetails,
    },
  };
};

export default networkResourcesAuthLoaded;
