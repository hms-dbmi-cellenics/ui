const configure = (userPoolId, identityPoolId, userPoolClientDetails) => ({
  Auth: {
    region: 'eu-west-1',
    identityPoolId,
    userPoolId,
    userPoolWebClientId: userPoolClientDetails.ClientId,

    mandatorySignIn: false,
    authenticationFlowType: 'USER_SRP_AUTH',

    oauth: {
      domain: userPoolClientDetails.Domain,
      scope: userPoolClientDetails.AllowedOAuthScopes,
      redirectSignIn: userPoolClientDetails.DefaultRedirectURI,
      redirectSignOut: userPoolClientDetails.LogoutURLs[0],
      responseType: userPoolClientDetails.AllowedOAuthFlows[0],
    },
  },
});

export default configure;
