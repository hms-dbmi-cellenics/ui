import Environment, { ssrGetCurrentEnvironment } from './environment';
import accountId from './getAccountId';

const configure = (userPoolId, identityPoolId, userPoolClientDetails) => {
  const currentEnvironment = ssrGetCurrentEnvironment();
  const bucketName = `biomage-originals-${currentEnvironment}-${accountId()}`;

  const storageConfig = {
    Storage: {
      AWSS3: {
        bucket: bucketName,
        region: 'eu-west-1',
        dangerouslyConnectToHttpEndpointForTesting: currentEnvironment === Environment.DEVELOPMENT,
        identityId: identityPoolId,
        customPrefix: {
          public: '',
        },
      },
    },
  };
  const redirectProtocol = (process.env.NODE_ENV === 'development') ? 'http:' : 'https:';
  const usingProtocol = (url) => url.startsWith(redirectProtocol);
  const signInRedirect = userPoolClientDetails.CallbackURLs.filter(usingProtocol)[0];
  const signOutRedirect = userPoolClientDetails.LogoutURLs.filter(usingProtocol)[0];

  const authConfig = {
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
        redirectSignIn: signInRedirect,
        redirectSignOut: signOutRedirect,
        responseType: userPoolClientDetails.AllowedOAuthFlows[0],
      },
    },
  };

  return (
    { ...authConfig, ...storageConfig }
  );
};

export default configure;
