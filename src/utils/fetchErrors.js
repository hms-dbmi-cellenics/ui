import endUserMessages from './endUserMessages';

class ServerError extends Error {
}

const throwIfRequestFailed = (response, json, friendlyMessage) => {
  if (!response.ok) {
    let { message } = json;
    if (response.status === 500) {
      console.error(`Status 500 fetching ${response.url}. Error in response: ${message}`);
      message = friendlyMessage;
    } else if (response.status === 401) {
      message = endUserMessages.ERROR_NOT_SIGNED_IN;
    }
    throw (new ServerError(message));
  }
};

const isServerError = (error) => (error instanceof ServerError);

export {
  throwIfRequestFailed,
  isServerError,
};
