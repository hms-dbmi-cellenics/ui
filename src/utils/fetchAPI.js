import getApiEndpoint from './apiEndpoint';
import authorizationHeader from './authorizationHeader';

const fetchAPI = async (path, params = {}) => {
  const headers = params.headers ? params.headers : {};
  const parameters = {
    ...params,
    headers: {
      ...headers,
      Authorization: authorizationHeader.Authorization,
    },
  };

  const url = getApiEndpoint() + path;
  const result = await fetch(url, parameters);
  return result;
};
export default fetchAPI;
