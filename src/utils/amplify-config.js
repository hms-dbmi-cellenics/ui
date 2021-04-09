const configure = (userPoolId, identityPoolId) => ({
  Auth: {

    region: 'eu-west-1',
    identityPoolId,
    userPoolId,
    userPoolWebClientId: 'qdhcbpbntcafq2qne04dvr2h',

    mandatorySignIn: false,
    authenticationFlowType: 'USER_SRP_AUTH',

    oauth: {
      domain: 'biomage-staging.auth.eu-west-1.amazoncognito.com',
      scope: ['email', 'phone', 'openid', 'aws.cognito.signin.user.admin', 'profile'],
      redirectSignIn: 'http://localhost:5000/experiments/e52b39624588791a7889e39c617f669e/data-exploration',
      redirectSignOut: 'http://localhost:5000/experiments/e52b39624588791a7889e39c617f669e/data-exploration',
      responseType: 'code',
    },
  },
});

export default configure;
