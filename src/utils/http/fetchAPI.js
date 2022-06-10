import APIError from 'utils/http/errors/APIError';
import FetchError from 'utils/http/errors/FetchError';
import getApiEndpoint from 'utils/apiEndpoint';
import getAuthJWT from 'utils/getAuthJWT';

import pushNotificationMessage from 'utils/pushNotificationMessage';

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

  if (!response.ok) {
    let data;
    try {
      data = await response.json();
    } catch (e) {
      // if we can't get extra error info from the response we don't want to fail
      // just return the error code, this happens in many tests
      // where we mock a string response instead of proper json
    }

    if (response.status === 503 && data?.message === 'Maintenance mode') {
      pushNotificationMessage('error', 'The system is undergoing scheduled maintenance, the platform may not be accessible for a few hours.');
    }

    // data.message & data.errors follow error formatting defined in:
    // HTTPError.v1.yaml
    throw new APIError(response.status, data?.message, data?.errors);
  }

  return await response.json();
};

export default fetchAPI;
