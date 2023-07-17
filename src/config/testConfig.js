const config = {
  supportEmail: 'ccbhelp@hms.harvard.edu',
  pipelineVersionToRerunQC: 1,
  workerVersion: 4, // needs to match workerVersion in API
  botToken: 'eG94Yi0zODE4MjQwMTYwODY5LTM4Mjk3Njc0OTQ4MDQtbDJtTHF4TTNpZFRRQXZYQUNJTXdFbDBx', // pragma: allowlist secret
  feedbackWebhookEndpoint: 'aHR0cHM6Ly9ob29rcy5zbGFjay5jb20vc2VydmljZXMvVDAzUTI3MjRRUksvQjAzUThCR0JLSEIvUk41elZtU1RudXUyMWxURUh1a3I3ajdJ', // pragma: allowlist secret
  referralWebhookEndpoint: 'aHR0cHM6Ly9ob29rcy5zbGFjay5jb20vc2VydmljZXMvVDAzUTI3MjRRUksvQjAzVDdDSjFVODIvWFJ3cGtaa2huT2ZCbEVObkNMamtad0pn', // pragma: allowlist secret
};

export default config;
