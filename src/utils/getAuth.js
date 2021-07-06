import { Auth } from 'aws-amplify';

const getAuth = async () => {
  const auth = {};
  try {
    console.log('INSIDE AUTH');
    const currentSession = await Auth.currentSession();
    const user = await Auth.currentAuthenticatedUser();
    auth.JWT = currentSession.getIdToken().getJwtToken();
    auth.userId = user.username;
  } catch (e) {
    console.log('User is not authenticated', e);
  }
  console.log('AUTH HERE  IS ', auth);
  return auth;
};

export default getAuth;
