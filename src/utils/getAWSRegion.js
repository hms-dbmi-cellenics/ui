const getAWSRegion = (env) => {
  if (env === 'development') {
    return 'eu-west-1';
  }

  const { AWS_REGION, DEFAULT_REGION } = process.env;

  if (!AWS_REGION && !DEFAULT_REGION) {
    throw new Error('AWS_REGION or DEFAULT_REGION must be set in the environment.');
  }

  return AWS_REGION || DEFAULT_REGION;
};

export default getAWSRegion;
