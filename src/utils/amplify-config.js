import Environment, { ssrGetCurrentEnvironment } from './environment';

const configure = (userPoolId, identityPoolId, userPoolClientDetails) => {
  const currentEnvironment = ssrGetCurrentEnvironment();

  const bucketName = `biomage-originals-${currentEnvironment}`;

  const storageConfig = {
    Storage: {
      AWSS3: {
        bucket: bucketName,
        region: 'eu-west-1',
        dangerouslyConnectToHttpEndpointForTesting: currentEnvironment === Environment.DEVELOPMENT,
        identityId: identityPoolId,
      },
    },
  };

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
        redirectSignIn: userPoolClientDetails.CallbackURLs[0],
        redirectSignOut: userPoolClientDetails.LogoutURLs[0],
        responseType: userPoolClientDetails.AllowedOAuthFlows[0],
      },
    },
  };

  return (
    { ...authConfig, ...storageConfig }
  );
};

export default configure;
