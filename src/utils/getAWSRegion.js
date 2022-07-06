const getAWSRegion = () => {
  // only works in ssr, where process.env is available

  if (process.env.NODE_ENV === 'development') {
    return 'eu-west-1';
  }

  const { AWS_REGION, AWS_DEFAULT_REGION } = process.env;

  if (!AWS_REGION && !AWS_DEFAULT_REGION) {
    throw new Error('AWS_REGION or DEFAULT_REGION must be set in the environment.');
  }

  return AWS_REGION || AWS_DEFAULT_REGION;
};

export default getAWSRegion;
