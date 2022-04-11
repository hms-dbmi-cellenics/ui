import getApiEndpoint from './apiEndpoint';
import getAuthJWT from './getAuthJWT';

const fetchAPI = async (path, params = {}, extras = {}) => {
  const headers = params.headers ? params.headers : {};
  const authJWT = extras.jwt || await getAuthJWT();

  const parameters = {
    ...params,
    headers: {
      ...headers,
      ...(authJWT && { Authorization: `Bearer ${authJWT}` }),
    },
  };

  const url = getApiEndpoint(extras.uiUrl) + path;
  const result = await fetch(url, parameters);
  return result;
};
export default fetchAPI;
