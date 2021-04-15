import {
  CognitoIdentityClient,
  ListIdentityPoolsCommand,
} from '@aws-sdk/client-cognito-identity';

import {
  CognitoIdentityProviderClient,
  ListUserPoolsCommand,
} from '@aws-sdk/client-cognito-identity-provider';

import { getDefaultRoleAssumerWithWebIdentity } from '@aws-sdk/client-sts';
import { fromTokenFile } from '@aws-sdk/credential-provider-web-identity';

const getAuthenticationInfo = async () => {
  let additionalClientParams = {};

  if (process.env.NODE_ENV !== 'development') {
    additionalClientParams = {
      ...additionalClientParams,
      credentials: fromTokenFile({
        roleAssumerWithWebIdentity: getDefaultRoleAssumerWithWebIdentity(),
      }),
    };
  }

  const identityPoolClient = new CognitoIdentityClient(
    {
      region: 'eu-west-1',
      ...additionalClientParams,
    },
  );

  const userPoolClient = new CognitoIdentityProviderClient(
    {
      region: 'eu-west-1',
      ...additionalClientParams,
    },
  );

  const [{ IdentityPools }, { UserPools }] = await Promise.all([
    identityPoolClient.send(
      new ListIdentityPoolsCommand({ MaxResults: 60 }),
    ),
    userPoolClient.send(
      new ListUserPoolsCommand({ MaxResults: 60 }),
    ),
  ]);

  const identityPoolId = IdentityPools.find(
    (pool) => pool.IdentityPoolName.includes('staging'),
  ).IdentityPoolId;

  const userPoolId = UserPools.find((pool) => pool.Name.includes('staging')).Id;

  return {
    props: {
      userPoolId,
      identityPoolId,
    },
  };
};

export default getAuthenticationInfo;
