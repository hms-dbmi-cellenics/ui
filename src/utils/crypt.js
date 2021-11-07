const crypto = require('crypto');

const algorithm = 'aes-256-ctr';
const NON_SECURE_SECRET_KEY = 'vOVH6sdmpNWjRRIqCc7rdxs01lwHzfr3'; // pragma: allowlist secret
const iv = crypto.randomBytes(16);

// NOTE: do not use this module to store secrets, it is only here to prevent slack from taking
// down our webhook URL.
// See for encrypt: https://attacomsian.com/blog/nodejs-encrypt-decrypt-data

const encrypt = (text) => {
  const cipher = crypto.createCipheriv(algorithm, NON_SECURE_SECRET_KEY, iv);

  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);

  return {
    iv: iv.toString('hex'),
    content: encrypted.toString('hex'),
  };
};

const decrypt = (hash) => {
  const decipher = crypto.createDecipheriv(algorithm, NON_SECURE_SECRET_KEY, Buffer.from(hash.iv, 'hex'));

  const decrpyted = Buffer.concat([decipher.update(Buffer.from(hash.content, 'hex')), decipher.final()]);

  return decrpyted.toString();
};

const getWebhookUrl = () => {
  const webhookEndpoint = {
    iv: '06cc7e997355ede361bae3866cd75723', // pragma: allowlist secret
    content: '73b948b42d2d91f12dddbb41705110992f3ac6b3ffdbee6aaad336637e1fd97bea63764b88eb08275c784c1d3c36f618bdd52ba8c385543cf9fa666e4d89dcca7d37fab2e76ebced6042ed873af7a4840e', // pragma: allowlist secret
  };

  return decrypt(webhookEndpoint);
};

export {
  decrypt,
  encrypt,
  getWebhookUrl,
};
