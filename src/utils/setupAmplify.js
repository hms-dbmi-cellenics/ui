import AWS from 'aws-sdk';
import Amplify, { Storage } from 'aws-amplify';
import { Credentials } from '@aws-amplify/core';

import Environment from './environment';

const setupAmplify = (currentEnvironment) => {
  // These will be replaced when we can actually make this work in prod/staging
  const identityPoolIds = {
    [Environment.PRODUCTION]: 'prodPlaceholderIdentityPoolId',
    [Environment.STAGING]: 'stagingPlaceholderIdentityPoolId',
    [Environment.DEVELOPMENT]: 'fake',
  };

  const bucketName = `biomage-originals-${currentEnvironment}`;

  Amplify.configure({
    Storage: {
      AWSS3: {
        bucket: bucketName, // REQUIRED -  Amazon S3 bucket
        region: 'eu-west-1', // OPTIONAL -  Amazon service region
        dangerouslyConnectToHttpEndpointForTesting: currentEnvironment === Environment.DEVELOPMENT,
        identityId: identityPoolIds[currentEnvironment],
      },
    },
  });

  // Configure Amplify to not use prefix when uploading to public folder, instead of '/'
  Storage.configure({
    customPrefix: {
      public: '',
    },
  });

  // Mock credentials so that it works with inframock
  if (currentEnvironment === Environment.DEVELOPMENT) {
    Credentials.get = async () => (
      new AWS.Credentials({
        accessKeyId: 'asd',
        secretAccessKey: 'asfdsa',
      })
    );

    Credentials.shear = () => (
      new AWS.Credentials({
        accessKeyId: 'asd',
        secretAccessKey: 'asfdsa',
      })
    );
  }
};

export default setupAmplify;
