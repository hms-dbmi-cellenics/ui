import nextConfig from 'next/config';

import { AccountId } from 'utils/deploymentInfo';

const accountId = nextConfig()?.publicRuntimeConfig?.accountId ?? AccountId.HMS;

const supportEmailsByAccountId = {
  [AccountId.HMS]: 'ccbhelp@hms.harvard.edu',
};

const botTokensByAccountId = {
  [AccountId.HMS]: 'eG94Yi0zODE4MjQwMTYwODY5LTM4Mjk3Njc0OTQ4MDQtbDJtTHF4TTNpZFRRQXZYQUNJTXdFbDBx', // pragma: allowlist secret
};

const feedbackWebhookEndpointsByAccountId = {
  [AccountId.HMS]: 'aHR0cHM6Ly9ob29rcy5zbGFjay5jb20vc2VydmljZXMvVDAzUTI3MjRRUksvQjAzUThCR0JLSEIvUk41elZtU1RudXUyMWxURUh1a3I3ajdJ', // pragma: allowlist secret
};

const referralWebhookEndpointsByAccountId = {
  [AccountId.HMS]: 'aHR0cHM6Ly9ob29rcy5zbGFjay5jb20vc2VydmljZXMvVDAzUTI3MjRRUksvQjAzVDdDSjFVODIvWFJ3cGtaa2huT2ZCbEVObkNMamtad0pn', // pragma: allowlist secret
};

const config = {
  supportEmail: supportEmailsByAccountId[accountId],
  pipelineVersionToRerunQC: 2,
  workerVersion: 4, // needs to match workerVersion in API
  botToken: botTokensByAccountId[accountId],
  feedbackWebhookEndpoint: feedbackWebhookEndpointsByAccountId[accountId],
  referralWebhookEndpoint: referralWebhookEndpointsByAccountId[accountId],
};

export default config;
