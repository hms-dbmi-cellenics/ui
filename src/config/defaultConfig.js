import nextConfig from 'next/config';

import { AccountId } from 'utils/deploymentInfo';

const accountId = nextConfig()?.publicRuntimeConfig?.accountId ?? AccountId.BIOMAGE;

const supportEmailsByAccountId = {
  [AccountId.BIOMAGE]: 'hello@biomage.net',
  [AccountId.HMS]: 'alex_pickering@hms.harvard.edu',
};

const config = {
  supportEmail: supportEmailsByAccountId[accountId],
  pipelineVersionToRerunQC: 2,
  workerVersion: 1,
};

export default config;
