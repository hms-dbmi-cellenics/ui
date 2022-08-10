import nextConfig from 'next/config';

import { AccountId } from 'utils/deploymentInfo';

const accountId = nextConfig()?.publicRuntimeConfig?.accountId ?? AccountId.BIOMAGE;

const supportEmailsByAccountId = {
  [AccountId.BIOMAGE]: 'hello@biomage.net',
  [AccountId.HMS]: 'alex_pickering@hms.harvard.edu',
};

const botTokensByAccountId = {
  [AccountId.BIOMAGE]: 'eG94Yi0xMTc1NDc1NTM5NzE0LTMyMjE3MTYwNDg4OTgtUWFXNmlwTEVSY1RJRXQycVU2RnJ3RGp1', // pragma: allowlist secret
  [AccountId.HMS]: 'eG94Yi0zODE4MjQwMTYwODY5LTM4Mjk3Njc0OTQ4MDQtbDJtTHF4TTNpZFRRQXZYQUNJTXdFbDBx', // pragma: allowlist secret
};

const webhookEndpointsByAccountId = {
  [AccountId.BIOMAGE]: 'aHR0cHMlM0ElMkYlMkZob29rcy5zbGFjay5jb20lMkZzZXJ2aWNlcyUyRlQwMTU1RFpGVk0wJTJGQjAyS0ZESEc0SkslMkZFY3ZZZVhQNVBoM0lQMjE0ZlNTRWhGT3c=', // pragma: allowlist secret
  [AccountId.HMS]: 'aHR0cHM6Ly9ob29rcy5zbGFjay5jb20vc2VydmljZXMvVDAzUTI3MjRRUksvQjAzUThCR0JLSEIvUk41elZtU1RudXUyMWxURUh1a3I3ajdJ', // pragma: allowlist secret
};

const config = {
  supportEmail: supportEmailsByAccountId[accountId],
  botToken: botTokensByAccountId[accountId],
  webhookEndpoint: webhookEndpointsByAccountId[accountId],
};

export default config;
