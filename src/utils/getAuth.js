import { Auth } from 'aws-amplify';

const getAuth = async () => {
  const auth = {};
  try {
    const currentSession = await Auth.currentSession();
    const user = await Auth.currentAuthenticatedUser();
    auth.JWT = currentSession.getIdToken().getJwtToken();
    auth.userId = user.username;
  } catch (e) {
    console.warn('User is not authenticated', e);
  }
  return auth;
};

export default getAuth;
