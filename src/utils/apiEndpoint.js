const getApiEndpoint = () => {
  try {
    if (window.location.href.includes('biomage-ui-staging')) return 'https://biomage-api-staging.k8s-staging.biomage.net';
    if (window.location.href.includes('localhost')) return 'http://localhost:3000';
  } catch (error) {
    console.error('Failed to get API endpoint', window.location.href);
  }
  return 'https://biomage-api.k8s-staging.biomage.net';
};

export default getApiEndpoint;
