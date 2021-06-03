class ServerError extends Error {
}

const throwIfRequestFailed = (response, json, friendlyMessage) => {
  if (!response.ok) {
    let { message } = json.message;
    if (response.status === 500) {
      console.error(`Status 500 fetching ${response.url}. Error in response: ${message}`);
      message = friendlyMessage;
    }
    throw new ServerError(message);
  }
};

const isServerError = (error) => (error instanceof ServerError);

export {
  throwIfRequestFailed,
  isServerError,
};
