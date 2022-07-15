const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';

const privacyPolicyIsNotAccepted = (user, domainName) => user?.attributes['custom:agreed_terms'] !== 'true' && domainName === DomainName.BIOMAGE;

const Environment = {
  DEVELOPMENT: 'development',
  STAGING: 'staging',
  PRODUCTION: 'production',
};

const DomainName = {
  BIOMAGE: 'scp.biomage.net',
  BIOMAGE_STAGING: 'scp-staging.biomage.net',
};

const ssrGetDeploymentInfo = () => {
  let currentEnvironment = null;

  if (process.env.NODE_ENV === 'test') {
    return Environment.DEVELOPMENT;
  }

  if (!process.env) {
    throw new Error('ssrGetDeploymentInfo must be called on the server side. Refer to `store.networkResources.environment` for the actual environment.');
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

  let domainName;
  if (
    [DomainName.BIOMAGE, DomainName.BIOMAGE_STAGING].includes(process.env.DOMAIN_NAME)
    || currentEnvironment === Environment.DEVELOPMENT
  ) {
    domainName = DomainName.BIOMAGE;
  }

  return { environment: currentEnvironment, domainName };
};

export {
  isBrowser, ssrGetDeploymentInfo, DomainName, Environment, privacyPolicyIsNotAccepted,
};
