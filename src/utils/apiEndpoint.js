const getApiEndpoint = () => {
  try {
    if (window.location.href.includes('scp-staging')) return 'https://api.scp-staging.biomage.net';
    if (window.location.href.includes('localhost')) return 'http://localhost:3000';
  } catch (error) {
    console.error('Failed to get API endpoint', window.location.href);
  }
  return 'https://api.scp.biomage.net';
};

export default getApiEndpoint;
