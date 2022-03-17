const decrypt = (hash) => decodeURIComponent(window.atob(hash));

const getWebhookUrl = () => {
  const webhookEndpoint = 'aHR0cHMlM0ElMkYlMkZob29rcy5zbGFjay5jb20lMkZzZXJ2aWNlcyUyRlQwMTU1RFpGVk0wJTJGQjAyS0ZESEc0SkslMkZFY3ZZZVhQNVBoM0lQMjE0ZlNTRWhGT3c='; // pragma: allowlist secret
  return decrypt(webhookEndpoint);
};

// Token for Logger bot to post errors as file
// Required becuase webhook doesn't suport file uploads
const getLoggerBotToken = () => {
  const botToken = 'eG94Yi0xMTc1NDc1NTM5NzE0LTMyMjE3MTYwNDg4OTgtUWFXNmlwTEVSY1RJRXQycVU2RnJ3RGp1'; // pragma: allowlist secret
  return decrypt(botToken);
};

export {
  getWebhookUrl,
  getLoggerBotToken,
};
