import nextConfig from 'next/config';
import { AccountId } from 'utils/deploymentInfo';

const accountId = nextConfig()?.publicRuntimeConfig?.accountId ?? AccountId.BIOMAGE;

const accountInfo = {
  [AccountId.HMS]: {
    supportEmail: 'ccbhelp@hms.harvard.edu',
    botToken: 'eG94Yi0zODE4MjQwMTYwODY5LTM4Mjk3Njc0OTQ4MDQtbDJtTHF4TTNpZFRRQXZYQUNJTXdFbDBx',
    feedbackWebhookEndpoint: 'aHR0cHM6Ly9ob29rcy5zbGFjay5jb20vc2VydmljZXMvVDAzUTI3MjRRUksvQjAzUThCR0JLSEIvUk41elZtU1RudXUyMWxURUh1a3I3ajdJ',
    referralWebhookEndpoint: 'aHR0cHM6Ly9ob29rcy5zbGFjay5jb20vc2VydmljZXMvVDAzUTI3MjRRUksvQjAzVDdDSjFVODIvWFJ3cGtaa2huT2ZCbEVObkNMamtad0pn',
  },
  default: {
    supportEmail: 'hello@biomage.net',
    botToken: 'eG94Yi0xMTc1NDc1NTM5NzE0LTMyMjE3MTYwNDg4OTgtUWFXNmlwTEVSY1RJRXQycVU2RnJ3RGp1',
    feedbackWebhookEndpoint: 'aHR0cHMlM0ElMkYlMkZob29rcy5zbGFjay5jb20lMkZzZXJ2aWNlcyUyRlQwMTU1RFpGVk0wJTJGQjAyS0ZESEc0SkslMkZFY3ZZZVhQNVBoM0lQMjE0ZlNTRWhGT3c=',
    referralWebhookEndpoint: 'aHR0cHM6Ly9ob29rcy5zbGFjay5jb20vc2VydmljZXMvVDAxNTVEWkZWTTAvQjAyQVk0ODQxQ0cvQ0x3Mms4dTBtMkUzcDBVNUhhbjBqeTBv',
  },
};

const getAccountInfo = (account) => accountInfo[account] || accountInfo.default;

const config = {
  supportEmail: getAccountInfo(accountId).supportEmail,
  pipelineVersionToRerunQC: 2,
  workerVersion: 4, // needs to match workerVersion in API
  botToken: getAccountInfo(accountId).botToken,
  feedbackWebhookEndpoint: getAccountInfo(accountId).feedbackWebhookEndpoint,
  referralWebhookEndpoint: getAccountInfo(accountId).referralWebhookEndpoint,
};

export default config;
