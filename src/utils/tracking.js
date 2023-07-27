import { init, push } from '@socialgouv/matomo-next';
import Auth from '@aws-amplify/auth';

import { Environment } from './deploymentInfo';
import getDomainSpecificContent from './getDomainSpecificContent';

const MATOMO_URL = `https://${getDomainSpecificContent('matomoName')}.matomo.cloud`;

// To test a staging deployment, you'll need to go to matomo.cloud
// and change the URL there to point to your staging env URL.
// To test locally, just enable the development environemnt.
// The Site Ids are defined in matomo.cloud
const trackingInfo = {
  [Environment.PRODUCTION]: {
    enabled: true,
    siteId: 1,
    containerId: getDomainSpecificContent('containerIds')[Environment.PRODUCTION],
  },
  [Environment.STAGING]: {
    enabled: false,
    siteId: 2,
    containerId: getDomainSpecificContent('containerIds')[Environment.STAGING],
  },
  [Environment.DEVELOPMENT]: {
    enabled: false,
    siteId: 3,
    containerId: getDomainSpecificContent('containerIds')[Environment.DEVELOPMENT],
  },
};

let env = Environment.DEVELOPMENT;

const getTrackingDetails = (e) => ({ ...trackingInfo[e] });

const initTracking = async (environment) => {
  // set the environment for the tracking sytem
  env = environment;
  const { siteId, enabled } = getTrackingDetails(env);
  if (enabled === false) {
    return;
  }

  const user = await Auth.currentAuthenticatedUser();
  // first set the user ID and then initialize the tracking so it correctly tracks first page.
  push(['setUserId', user.attributes.email]);
  init({ url: MATOMO_URL, siteId });
};

// reset the user ID when loggging out
const resetTrackingId = () => {
  const { enabled } = getTrackingDetails(env);
  if (enabled === false) {
    return;
  }

  push(['resetUserId']);
  // we also force a new visit to be created for the pageviews after logout
  push(['appendToTrackingUrl', 'new_visit=1']);
};

export {
  initTracking, resetTrackingId, getTrackingDetails,
};
