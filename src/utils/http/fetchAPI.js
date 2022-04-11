import APIError from 'utils/http/errors/APIError';
import FetchError from 'utils/http/errors/FetchError';
import getApiEndpoint from 'utils/apiEndpoint';
import getAuthJWT from 'utils/getAuthJWT';

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

  let response;
  try {
    response = await fetch(url, parameters);
  } catch (e) {
    // wrap fetch errors in custom error
    throw new FetchError(e);
  }

  const data = await response.json();

  if (!response.ok) {
    // data.message & data.errors follow error formatting defined in:
    // HTTPError.v1.yaml
    throw new APIError(response.status, data?.message, data?.errors);
  }

  // only parse response into JSON if needed because
  // most patch / put reqs do not need a response
  return data;
};

export default fetchAPI;
