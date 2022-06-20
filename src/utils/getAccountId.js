const getAccountId = (environment) => {
  let accountID;
  if (environment === 'development') {
    accountID = '000000000000';
  } else {
    accountID = '242905224710';
  }
  return accountID;
};

export default getAccountId;
