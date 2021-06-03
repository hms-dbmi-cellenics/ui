import endUserMessages from './endUserMessages';

// Babel transpiling does not work properly extending native types
// class ServerError extends Error
function ServerError(message) {
  this.message = message;
  this.stack = Error().stack;
}
ServerError.prototype = Object.create(Error.prototype);
ServerError.prototype.name = 'ServerError';

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
