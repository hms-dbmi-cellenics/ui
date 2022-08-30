import Auth from '@aws-amplify/auth';
import StackTrace from 'stacktrace-js';
import { getLoggerBotToken } from 'utils/slack';

const extractExperimentId = (url) => {
  const match = url.match(/experiments\/([^/]+)/i);
  return match ? match[1] : null;
};

// Truncates data arrays so that it doesn't produce large logs
const NUM_DATA_TO_SHOW = 20;
const truncateCollection = (arr) => {
  if (arr.length < NUM_DATA_TO_SHOW) return arr;

  const truncatedArr = arr.slice(0, NUM_DATA_TO_SHOW);
  truncatedArr.push('...');
  return truncatedArr;
};

const trimOutput = (key, item) => {
  if (Array.isArray(item)) return truncateCollection(item);
  if (item instanceof Set) return new Set(truncateCollection(Array.from(item)));

  if (item !== null && typeof item === 'object') {
    const newItem = Object.keys(item).reduce((newObject, childKey) => {
      // eslint-disable-next-line no-param-reassign
      newObject[childKey] = trimOutput(childKey, item[childKey]);
      return newObject;
    }, {});

    return newItem;
  }

  return item;
};

const buildErrorMessage = async (errorObject, reduxState, context) => {
  const {
    user, timestamp, experimentId, url,
  } = context;

  const stack = await StackTrace.fromError(errorObject);
  const stringifiedStack = stack.map((sf) => sf.toString()).join('\n');

  let message = `
    ===== ERROR STACK =====
    Message:
    ${errorObject.message}
    At:
    ${stringifiedStack}

    === DETAILS ===
    User: ${user.attributes.name} <${user.attributes.email}> ${user.username}
    ExperimentID: ${experimentId}
    URL: ${url}
    Timestamp: ${timestamp}

    `;

  if (reduxState) {
    message += `===== REDUX STATE =====
    ${JSON.stringify(reduxState, trimOutput, 2)}`;
  }
  return message;
};

const postError = async (errorLog, context) => {
  const {
    user, timestamp, experimentId, url, environment,
  } = context;

  const message = `
  \u26A0  [${environment.toUpperCase()}] Uncaught UI Error - ExpID ${experimentId} - ${timestamp}
  URL: ${url}

  User: ${user.attributes.name} <${user.attributes.email}> ${user.username}
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

  try {
    const res = await fetch('https://slack.com/api/files.upload', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      throw new Error(
        `Failed sending error message to Slack: ${res.status}`, res.statusText,
      );
    }
  } catch (err) {
    console.error(err);
  }
};

const postErrorToSlack = async (errorObject, reduxState) => {
  const user = await Auth.currentAuthenticatedUser();

  const timestamp = new Date().toISOString();
  const url = window.location.href;
  const experimentId = extractExperimentId(url);
  const { networkResources: { environment } } = reduxState;

  const context = {
    user,
    timestamp,
    experimentId,
    url,
    environment,
  };

  const errorLog = await buildErrorMessage(errorObject, reduxState, context);
  await postError(errorLog, context);
};

export default postErrorToSlack;
