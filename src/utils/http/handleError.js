import pushNotificationMessage from 'utils/pushNotificationMessage';
import endUserMessages from '../endUserMessages';

const httpStatusCodes = require('./httpStatusCodes');

const handleCodedErrors = (error, message, notifyUser) => {
  let errorMessage = `${message} ${error.userMessage}`;

  // we might want to override some errors to make them more user friendly
  // like the UNAUTHORIZED
  switch (error.statusCode) {
    case httpStatusCodes.BAD_REQUEST:
    // message = message
      break;
    case httpStatusCodes.NOT_FOUND:
    // message = default_message
      break;
    case httpStatusCodes.UNAUTHORIZED:
      // TODO: check that this won't be reached because we redirect to login first
      // errorMessage = endUserMessages.ERROR_NO_PERMISSIONS;
      break;
    case httpStatusCodes.FORBIDDEN:
      errorMessage = endUserMessages.ERROR_NO_PERMISSIONS;
      break;
    default:
  }
  // errorMessage += error.name;
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

  console.log(`${message} ${error}`);
};

const handleError = (error, message, notifyUser = true) => {
  console.log('error');
  console.log(Object.prototype.toString.call(error));

  console.log(error);
  let errorMessage;

  if (error && error.statusCode) {
    errorMessage = handleCodedErrors(error, message, notifyUser);
  } else {
    // TODO consider adding operational - programmatic errors
    // so we can log ones and not the others
    errorMessage = handleGenericErrors(error, message, notifyUser);
  }

  return errorMessage;
};

export default handleError;
