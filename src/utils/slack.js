import config from 'config';

const decrypt = (hash) => decodeURIComponent(window.atob(hash));

const getWebhookUrl = () => {
  const { webhookEndpoint } = config;
  return decrypt(webhookEndpoint);
};

// Token for Logger bot to post errors as file
// Required becuase webhook doesn't suport file uploads
const getLoggerBotToken = () => {
  const { botToken } = config;
  return decrypt(botToken);
};

export {
  getWebhookUrl,
  getLoggerBotToken,
};
