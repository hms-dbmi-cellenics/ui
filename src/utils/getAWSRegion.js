const getAWSRegion = () => {
  const region = process.env.AWS_REGION || process.env.DEFAULT_REGION || 'eu-west-1';
  return region;
};

export default getAWSRegion;
