import Auth from '@aws-amplify/auth';

const getAuthJWT = async () => {
  let authJWT = null;
  try {
    const currentSession = await Auth.currentSession();
    authJWT = currentSession.getIdToken().getJwtToken();
  } catch (e) {
    authJWT = null;
  }

  return authJWT;
};

export default getAuthJWT;
