import getApiEndpoint from './apiEndpoint';

const fetchAPI = async (path, params = {}) => {
  const headers = params.headers ? params.headers : {};
  const parameters = {
    ...params,
    headers: {
      ...headers,
      Authorization: 'Bearer admin',
    },
  };
  let url = path;
  if (!path.includes(getApiEndpoint())) {
    url = getApiEndpoint() + url;
  }

  const result = await fetch(url, parameters);

  return result;
};
export default fetchAPI;
