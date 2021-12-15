const Environment = {
  DEVELOPMENT: 'development',
  STAGING: 'staging',
  PRODUCTION: 'production',
};

const ssrGetCurrentEnvironment = () => {
  let currentEnvironment = null;

  if (process.env.NODE_ENV === 'test') {
    return Environment.DEVELOPMENT;
  }

  if (process.browser) {
    throw new Error('ssrGetCurrentEnvironment must be called on the server side. Refer to `store.networkResources.environment` for the actual environment.');
  }

  switch (process.env.K8S_ENV) {
    case 'production':
      currentEnvironment = Environment.PRODUCTION;
      break;
    case 'staging':
      currentEnvironment = Environment.STAGING;
      break;
    default:
      currentEnvironment = Environment.DEVELOPMENT;
      break;
  }

  return currentEnvironment;
};

export { ssrGetCurrentEnvironment };
export default Environment;
