const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';

const Environment = {
  DEVELOPMENT: 'development',
  STAGING: 'staging',
  PRODUCTION: 'production',
};

const DomainName = {
  HMS: 'cellenics.hms.harvard.edu',
  HMS_STAGING: 'staging.single-cell-platform.net',
};

const AccountId = {
  HMS: '160782110667',
};

const ssrGetDeploymentInfo = () => {
  let currentEnvironment = null;

  if (!process.env) {
    throw new Error('ssrGetDeploymentInfo must be called on the server side. Refer to `store.networkResources.environment` for the actual environment.');
  }

  if (process.env.NODE_ENV === 'test') {
    return { environment: Environment.DEVELOPMENT, domainName: DomainName.HMS };
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

  const domainName = currentEnvironment !== Environment.DEVELOPMENT
    ? process.env.DOMAIN_NAME
    : DomainName.HMS;

  return { environment: currentEnvironment, domainName };
};

export {
  isBrowser, ssrGetDeploymentInfo, DomainName, AccountId, Environment,
};
