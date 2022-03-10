const postToSlack = async (messageData) => {
  const { getWebhookUrl } = await import('utils/crypt');

  const r = await fetch(getWebhookUrl(), {
    method: 'POST',
    body: JSON.stringify(messageData),
  });

  if (!r.ok) {
    throw new Error('Invalid status code returned.');
  }
};

export default postToSlack;
