const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';

const Environment = {
  DEVELOPMENT: 'development',
  STAGING: 'staging',
  PRODUCTION: 'production',
};

const isDevelopment = (url) => url.hostname.includes('localhost') || url.hostname.includes('127.0.0.1');
const isStaging = (url) => url.hostname.includes('staging');

// TODO: Ask in PR if we should look into a better way of checking current environment,
// perhaps something more explicit like actually setting a flag
const getCurrentEnvironment = () => {
  try {
    const url = new URL(window.location.href);

    if (isDevelopment(url)) {
      return Environment.DEVELOPMENT;
    }

    if (isStaging(url)) {
      return Environment.STAGING;
    }

    return Environment.PRODUCTION;
  } catch (error) {
    console.error('Failed to get current environment', window.location.href);
  }
};

export { isBrowser, getCurrentEnvironment };

export default Environment;
