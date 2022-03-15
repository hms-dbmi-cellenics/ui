const decrypt = (hash) => window.atob(escape(hash));

const getWebhookUrl = () => {
  const webhookEndpoint = 'aHR0cHM6Ly9ob29rcy5zbGFjay5jb20vc2VydmljZXMvVDAxNTVEWkZWTTAvQjAyS0ZESEc0SksvRWN2WWVYUDVQaDNJUDIxNGZTU0VoRk93';
  return decrypt(webhookEndpoint);
};

// Token for Logger bot to post errors as file
// Required becuase webhook doesn't suport file uploads
const getLoggerBotToken = () => {
  const botToken = 'eG94Yi0xMTc1NDc1NTM5NzE0LTMyMjE3MTYwNDg4OTgtUWFXNmlwTEVSY1RJRXQycVU2RnJ3RGp1';
  return decrypt(botToken);
};

export {
  decrypt,
  getWebhookUrl,
  getLoggerBotToken,
};
