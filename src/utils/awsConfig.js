const getAccountId = (environment) => {
  let accountID;
  if (environment === 'development') {
    accountID = '000000000000';
  } else {
    accountID = '242905224710';
  }
  return accountID;
};

const getAWSRegion = () => {
  const region = process.env.AWS_REGION || process.env.DEFAULT_REGION || 'eu-west-1';
  return region;
};

export { getAccountId, getAWSRegion };
