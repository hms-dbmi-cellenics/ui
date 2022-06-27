import * as AWS from '@aws-sdk/client-sts';
import { getDefaultRoleAssumerWithWebIdentity } from '@aws-sdk/client-sts';
import { fromTokenFile } from '@aws-sdk/credential-provider-web-identity';

const getAccountId = async () => {
  const sts = new AWS.STS({
    region: getAWSRegion(),
    credentials: fromTokenFile({
      roleAssumerWithWebIdentity: getDefaultRoleAssumerWithWebIdentity(),
    }),
  });
  console.log('HERE LMAO', getAWSRegion());

  const accountID = await sts.getCallerIdentity({}).promise;
  console.log('ID IS ', accountID);

  return accountID;
};

const getAWSRegion = () => {
  const region = process.env.AWS_REGION || process.env.DEFAULT_REGION || 'eu-west-1';
  return region;
};

export { getAccountId, getAWSRegion };
