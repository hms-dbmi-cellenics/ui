import APIError from 'utils/http/errors/APIError';
import getApiEndpoint from '../apiEndpoint';
import getAuthJWT from '../getAuthJWT';
import FetchError from './errors/FetchError';

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

  const isJson = response.headers.get('content-type')?.includes('application/json');

  if (response.ok) {
    // only parse response into JSON if needed because
    // most patch / put reqs do not need a response
    if (returnValue) {
      return response.json();
    }
    return;
  }
  // console.log('response');
  // console.log(response);
  // if the response is not OK, parse json an return API error message
  if (!response.ok) {
    console.log('reponse type ', response.headers.get('content-type'));
    console.log('response not ok, ', response, typeof (response));
    const data = isJson ? await response.json() : null;
    // data.message & data.errors follow error formatting defined in:
    // HTTPError.v1.yaml
    console.log('response not ok, raising APIError, ', data);
    throw new APIError(response.status, data?.message, data?.errors);
  }

  // only parse response into JSON if needed because
  // most patch / put reqs do not need a response
  if (returnValue) return response.json();
};

export default fetchAPI;
