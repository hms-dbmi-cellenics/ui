import config from 'config';

const decrypt = (hash) => decodeURIComponent(window.atob(hash));

const getFeedbackWebhookUrl = () => {
  const { feedbackWebhookEndpoint } = config;
  return decrypt(feedbackWebhookEndpoint);
};

const getReferralWebhookUrl = () => {
  const { referralWebhookEndpoint } = config;
  return decrypt(referralWebhookEndpoint);
};

// Token for Logger bot to post errors as file
// Required becuase webhook doesn't suport file uploads
const getLoggerBotToken = () => {
  const { botToken } = config;
  return decrypt(botToken);
};

export {
  getFeedbackWebhookUrl,
  getReferralWebhookUrl,
  getLoggerBotToken,
};
