import APIError from 'utils/http/errors/APIError';
import FetchError from 'utils/http/errors/FetchError';
import getApiEndpoint from 'utils/apiEndpoint';
import getAuthJWT from 'utils/getAuthJWT';

const fetchAPI = async (path, params = {}, extras = {}, returnValue = true) => {
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

  // if the response is not OK, parse json an return API error message
  if (!response.ok) {
    const isJson = response.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await response.json() : null;
    // data.message & data.errors follow error formatting defined in:
    // HTTPError.v1.yaml
    throw new APIError(response.status, data?.message, data?.errors);
  }

  // only parse response into JSON if needed because
  // most patch / put reqs do not need a response
  if (returnValue) return response.json();
};

export default fetchAPI;
