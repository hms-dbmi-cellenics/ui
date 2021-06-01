class ServerError extends Error {
}

const throwWithEndUserMessage = (response, json, friendlyMessage) => {
  if (!response.ok) {
    let messageToSend = json.message;
    if (response.status === 500) {
      console.error(`Status 500 fetching ${response.url}. Hidding full error from user: ${messageToSend}`);
      messageToSend = friendlyMessage;
    }
    throw new ServerError(messageToSend);
  }
};

const isServerError = (error) => !(error instanceof ServerError);

export {
  throwWithEndUserMessage,
  isServerError,
};
