import { Auth } from 'aws-amplify';
import getApiEndpoint from './apiEndpoint';

const fetchAPI = async (path, params = {}) => {
  const headers = params.headers ? params.headers : {};

  let authJWT = null;

  try {
    const currentSession = await Auth.currentSession();
    authJWT = currentSession.getIdToken().getJwtToken();
  } catch (e) {
    authJWT = null;
  }

  const parameters = {
    ...params,
    headers: {
      ...headers,
      ...(authJWT && { Authorization: `Bearer ${authJWT}` }),
    },
  };

  const url = getApiEndpoint() + path;
  const result = await fetch(url, parameters);
  return result;
};
export default fetchAPI;
