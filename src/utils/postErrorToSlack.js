import Auth from '@aws-amplify/auth';
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

const buildErrorMessage = (error, info, reduxDump, context) => {
  const {
    user, timestamp, experimentId, url,
  } = context;

  let message = `
    Uncaught UI Error - Exp ID ${experimentId} - ${timestamp}

    === DETAILS ===
    User: ${user.attributes.name} <${user.attributes.email}> ${user.username}
    ExperimentID: ${experimentId}
    URL: ${url}
    Timestamp: ${timestamp}

    ===== ERROR =====
    ${error.stack}

    `;

  if (info?.componentStack) {
    message += `===== COMPONENT STACK =====
    ${info.componentStack}

    `;
  }

  if (reduxDump) {
    message += `===== REDUX STATE =====
    ${JSON.stringify(reduxDump, trimOutput, 2)}`;
  }
  return message;
};

const postError = async (errorLog, context) => {
  const {
    user, timestamp, experimentId, url,
  } = context;

  const message = `
  \u26A0  Uncaught UI Error - ExpID ${experimentId} - ${timestamp}
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

const postErrorToSlack = async (error, info, reduxDump) => {
  const user = await Auth.currentAuthenticatedUser();

  const timestamp = new Date().toISOString();
  const url = window.location.href;
  const experimentId = extractExperimentId(url);

  const context = {
    user,
    timestamp,
    experimentId,
    url,
  };

  const errorLog = buildErrorMessage(error, info, reduxDump, context);
  await postError(errorLog, context);
};

export default postErrorToSlack;
