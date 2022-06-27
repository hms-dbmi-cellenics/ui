const getApiEndpoint = (location) => {
  try {
    const url = new URL(location || window.location.href);

    if (url.hostname.includes('staging')) {
      return url.origin.replace('ui', 'api');
    }

    if (url.hostname.includes('localhost') || url.hostname.includes('127.0.0.1')) {
      return 'http://localhost:3000';
    }

    return `https://api.${process.env.DOMAIN_NAME}`;
  } catch (error) {
    console.error('Failed to get API endpoint.');
    console.error(error);
  }
};

export default getApiEndpoint;
