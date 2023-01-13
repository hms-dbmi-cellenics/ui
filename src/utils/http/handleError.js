import { Environment, ssrGetDeploymentInfo } from 'utils/deploymentInfo';
import postErrorToSlack from 'utils/postErrorToSlack';
import pushNotificationMessage from 'utils/pushNotificationMessage';
import endUserMessages from 'utils/endUserMessages';

import httpStatusCodes from 'utils/http/httpStatusCodes';

const { environment } = ssrGetDeploymentInfo();

const handleCodedErrors = (error, message = null, notifyUser = null) => {
  let errorMessage = message ?? error.message;

  // let errorMessage = [message, error.userMessage].filter((x) => x).join(' ');

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
  const errorMessage = message ?? error.message;

  if (notifyUser) {
    pushNotificationMessage('error', `${message}`);
  }

  if (environment === Environment.PRODUCTION) {
    // add the intended user message to the error to know where
    // the error comes from
    if (message) {
      // eslint-disable-next-line no-param-reassign
      error.message += message;
    }
    postErrorToSlack(error);
  }

  return errorMessage;
};

const handleError = (error, message, notifyUser = true) => {
  let errorMessage;

  if (error && error.statusCode) {
    errorMessage = handleCodedErrors(error, message, notifyUser);
  } else {
    errorMessage = handleGenericErrors(error, message, notifyUser);
  }

  return errorMessage;
};

export default handleError;
