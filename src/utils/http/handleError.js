import Environment, { ssrGetCurrentEnvironment } from 'utils/environment';
import postErrorToSlack from 'utils/postErrorToSlack';
import pushNotificationMessage from 'utils/pushNotificationMessage';
import endUserMessages from 'utils/endUserMessages';

import httpStatusCodes from 'utils/http/httpStatusCodes';

const env = ssrGetCurrentEnvironment();

const handleCodedErrors = (error, message, notifyUser) => {
  let errorMessage = [message, error.userMessage].filter((x) => x).join(' ');

  // We might want to override the API message for some errors to make them
  // more user friendly like the FORBIDDEN no permissions.
  switch (error.statusCode) {
    case httpStatusCodes.FORBIDDEN:
      errorMessage = endUserMessages.ERROR_NO_PERMISSIONS;
      break;
    default:
  }

  if (notifyUser) {
    pushNotificationMessage('error', errorMessage);
  }

  return errorMessage;
};

const handleGenericErrors = (error, message, notifyUser) => {
  // TODO this should probably be a console log, or just caught by error boundary
  // probably not, just to slack
  // decide not to include error in the user notification
  if (notifyUser) {
    pushNotificationMessage('error', `${message}`);
  }

  if (env === Environment.PRODUCTION) {
  // add the intended user message to the error to now where
  // the error comes from
    if (message) {
    // eslint-disable-next-line no-param-reassign
      error.message += message;
    }
    postErrorToSlack(error);
  }

  return message;
};

const handleError = (error, message, notifyUser = true) => {
  let errorMessage;

  console.log('elcs error', error);
  if (error && error.statusCode) {
    errorMessage = handleCodedErrors(error, message, notifyUser);
  } else {
    errorMessage = handleGenericErrors(error, message, notifyUser);
  }

  return errorMessage;
};

export default handleError;
