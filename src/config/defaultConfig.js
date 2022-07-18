import { DomainName } from 'utils/deploymentInfo';

const supportEmailsByDomainName = {
  [DomainName.BIOMAGE]: 'hello@biomage.net',
  [DomainName.BIOMAGE_STAGING]: 'hello@biomage.net',
  [DomainName.HMS]: 'alex_pickering@hms.harvard.edu',
};

const config = {
  supportEmail: supportEmailsByDomainName[process.env.DOMAIN_NAME],
};

export default config;
