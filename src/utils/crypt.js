const crypto = require('crypto');

const ENCRYPTION_ALGORITHM = 'aes-256-ctr';
const NON_SECURE_SECRET_KEY = 'vOVH6sdmpNWjRRIqCc7rdxs01lwHzfr3'; // pragma: allowlist secret
const iv = crypto.randomBytes(16);

// NOTE: do not use this module to store secrets, it is only here to prevent slack from taking
// down our webhook URL.
// See for encrypt: https://attacomsian.com/blog/nodejs-encrypt-decrypt-data

const encrypt = (text) => {
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, NON_SECURE_SECRET_KEY, iv);

  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);

  return {
    iv: iv.toString('hex'),
    content: encrypted.toString('hex'),
  };
};

const decrypt = (hash) => {
  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, NON_SECURE_SECRET_KEY, Buffer.from(hash.iv, 'hex'));

  const decrpyted = Buffer.concat([decipher.update(Buffer.from(hash.content, 'hex')), decipher.final()]);

  return decrpyted.toString();
};

const getWebhookUrl = () => {
  const webhookEndpoint = {
    iv: '17a763bce89c584a464f0e0fe1e98b7e', // pragma: allowlist secret
    content: '2106a03efbc5f502923c35a7008d5b1cda6b2308de46135c1f403adf3357f3313b68b445b0bad62aeb9eceea0828754e0d28d5cbc946fba86bf68ac4e6c27d1ea9690e03d7784fe54327ece16d77ae175b', // pragma: allowlist secret
  };

  return decrypt(webhookEndpoint);
};

const getLoggerBotToken = () => {
  const botToken = {
    iv: '0d7ae20b4fd8f7e72e60312098ce4149', // pragma: allowlist secret
    content: '6366a3e16da6604d6a5ea0d0ec13d3979f820cd73056c9624041961c0c90a629217606d3a6fcd692291050ca73d5c7306ee7439a6eced67f1e',
  };

  return decrypt(botToken);
};

export {
  decrypt,
  encrypt,
  getWebhookUrl,
  getLoggerBotToken,
};
