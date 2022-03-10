import Auth from '@aws-amplify/auth';
import { getLoggerBotToken } from 'utils/crypt';

const extractExperimentId = (url) => {
  const match = url.match(/experiments\/([^/]+)/i);
  return match ? match[1] : null;
};

const buildErrorMessage = (error, componentStack, context) => {
  const {
    user, timestamp, experimentId, url,
  } = context;

  return (`
    Uncaught UI Error - Exp ID ${experimentId} - ${timestamp}

    === DETAILS ===
    Name: ${user.attributes.name}
    Email: ${user.attributes.email}
    UserID: ${user.username}
    ExperimentID: ${experimentId}
    URL: ${url}
    Timestamp: ${timestamp}

    ===== ERROR =====
    ${error.stack}

    ===== COMPONENT STACK =====
    ${componentStack}`
  );
};

const postError = async (errorLog, context) => {
  const {
    user, timestamp, experimentId, url,
  } = context;

  const message = `
  \u26A0  Uncaught UI Error - ExpID ${experimentId} - ${timestamp}
  URL: ${url}

  User: ${user.attributes.name}
  Email: ${user.attributes.email}
  User ID: ${user.username}
  Experiment ID: ${experimentId}`;

  const formData = new FormData();

  const formFields = {
    token: getLoggerBotToken(),
    title: `UI Error at ${new Date().toISOString()}`,
    initial_comment: message,
    channels: 'error-logs',
    filename: `UI-error-${experimentId}-${timestamp}.log`,
    content: errorLog,
  };

  Object.entries(formFields).forEach(([fieldName, value]) => {
    formData.append(fieldName, value);
  });

  const res = await fetch('https://slack.com/api/files.upload', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    throw new Error('Failed sending to slack');
  }
};

const postErrorToSlack = async (error, info) => {
  const user = await Auth.currentAuthenticatedUser();

  const timestamp = new Date().toISOString();
  const url = window.location.href;
  const experimentId = extractExperimentId(url);
  const { componentStack } = info;

  const context = {
    user,
    timestamp,
    experimentId,
    url,
  };

  const errorLog = buildErrorMessage(error, componentStack, context);

  try {
    await postError(errorLog, context);
  } catch (err) {
    console.error(err);
  }
};

export default postErrorToSlack;
