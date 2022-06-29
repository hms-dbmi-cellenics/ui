import getAWSRegion from './getAWSRegion';

const configure = (userPoolId, identityPoolId, userPoolClientDetails) => {
  const redirectProtocol = (process.env.NODE_ENV === 'development') ? 'http:' : 'https:';
  const usingProtocol = (url) => url.startsWith(redirectProtocol);
  const signInRedirect = userPoolClientDetails.CallbackURLs.filter(usingProtocol)[0];
  const signOutRedirect = userPoolClientDetails.LogoutURLs.filter(usingProtocol)[0];

  const authConfig = {
    Auth: {
      region: getAWSRegion(),
      identityPoolId,
      userPoolId,
      userPoolWebClientId: userPoolClientDetails.ClientId,

      mandatorySignIn: false,
      authenticationFlowType: 'USER_SRP_AUTH',

      oauth: {
        domain: userPoolClientDetails.Domain,
        scope: userPoolClientDetails.AllowedOAuthScopes,
        redirectSignIn: signInRedirect,
        redirectSignOut: signOutRedirect,
        responseType: userPoolClientDetails.AllowedOAuthFlows[0],
      },
    },
  };

  return (
    { ...authConfig }
  );
};

export default configure;
