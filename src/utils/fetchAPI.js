import getApiEndpoint from './apiEndpoint';
import getAuth from './getAuth';

const fetchAPI = async (path, params = {}, extras = {}) => {
  const headers = params.headers ? params.headers : {};
  const auth = extras.jwt || await getAuth();
  console.log('AUTH IS ', auth);
  const parameters = {
    ...params,
    headers: {
      ...headers,
      ...(auth.JWT && { Authorization: `Bearer ${auth.JWT}` }),
      ...(auth.userId && { userId: auth?.userId }),
    },
  };

  const url = getApiEndpoint(extras.uiUrl) + path;
  const result = await fetch(url, parameters);

  return result;
};
export default fetchAPI;
