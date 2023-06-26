import nextConfig from 'next/config';

import { AccountId } from 'utils/deploymentInfo';

const accountId = nextConfig()?.publicRuntimeConfig?.accountId ?? AccountId.BIOMAGE;

const getSupportEmail = (account) => {
  if (account === AccountId.HMS) {
    return 'ccbhelp@hms.harvard.edu';
  }
  return 'hello@biomage.net';
};

const getBotToken = (account) => {
  if (account === AccountId.HMS) {
    return 'eG94Yi0zODE4MjQwMTYwODY5LTM4Mjk3Njc0OTQ4MDQtbDJtTHF4TTNpZFRRQXZYQUNJTXdFbDBx';// pragma: allowlist secret
  }
  return 'eG94Yi0xMTc1NDc1NTM5NzE0LTMyMjE3MTYwNDg4OTgtUWFXNmlwTEVSY1RJRXQycVU2RnJ3RGp1';// pragma: allowlist secret
};

const getFeedbackWebhookEndpoint = (account) => {
  if (account === AccountId.HMS) {
    return 'aHR0cHM6Ly9ob29rcy5zbGFjay5jb20vc2VydmljZXMvVDAzUTI3MjRRUksvQjAzUThCR0JLSEIvUk41elZtU1RudXUyMWxURUh1a3I3ajdJ';// pragma: allowlist secret
  }
  return 'aHR0cHMlM0ElMkYlMkZob29rcy5zbGFjay5jb20lMkZzZXJ2aWNlcyUyRlQwMTU1RFpGVk0wJTJGQjAyS0ZESEc0SkslMkZFY3ZZZVhQNVBoM0lQMjE0ZlNTRWhGT3c=';// pragma: allowlist secret
};

const getReferralWebhookEndpoint = (account) => {
  if (account === AccountId.HMS) {
    return 'aHR0cHM6Ly9ob29rcy5zbGFjay5jb20vc2VydmljZXMvVDAzUTI3MjRRUksvQjAzVDdDSjFVODIvWFJ3cGtaa2huT2ZCbEVObkNMamtad0pn';// pragma: allowlist secret
  }
  return 'aHR0cHM6Ly9ob29rcy5zbGFjay5jb20vc2VydmljZXMvVDAxNTVEWkZWTTAvQjAyQVk0ODQxQ0cvQ0x3Mms4dTBtMkUzcDBVNUhhbjBqeTBv';// pragma: allowlist secret
};

const config = {
  supportEmail: getSupportEmail(accountId),
  pipelineVersionToRerunQC: 2,
  workerVersion: 4, // needs to match workerVersion in API
  botToken: getBotToken(accountId),
  feedbackWebhookEndpoint: getFeedbackWebhookEndpoint(accountId),
  referralWebhookEndpoint: getReferralWebhookEndpoint(accountId),
};

export default config;
