import { init, push } from '@socialgouv/matomo-next';
import Auth from '@aws-amplify/auth';
import { AccountId } from 'utils/deploymentInfo';
import nextConfig from 'next/config';
import { Environment } from './deploymentInfo';

const accountId = nextConfig()?.publicRuntimeConfig?.accountId;
const isAccountHMS = accountId === AccountId.HMS;
const matomoName = isAccountHMS ? 'cellenics' : 'biomage';
const MATOMO_URL = `https://${matomoName}.matomo.cloud`;

// To test a staging deployment, you'll need to go to matomo.cloud
// and change the URL there to point to your staging env URL.
// To test locally, just enable the development environemnt.
// The Site Ids are defined in matomo.cloud
const trackingInfo = {
  [Environment.PRODUCTION]: {
    enabled: true,
    siteId: 1,
    containerId: isAccountHMS ? 'zdMhc9ey' : 'lkIodjnO',
  },
  [Environment.STAGING]: {
    enabled: false,
    siteId: 2,
    containerId: isAccountHMS ? 'lMoIVl5D' : 'FX7UBNS6',
  },
  [Environment.DEVELOPMENT]: {
    enabled: false,
    siteId: 3,
    containerId: isAccountHMS ? 'uMEoPBAl' : 'lS8ZRMXJ',
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
