import { init, push } from '@socialgouv/matomo-next';
import Auth from '@aws-amplify/auth';
import nextConfig from 'next/config';
import { Environment, AccountId } from './deploymentInfo';

const accountId = nextConfig()?.publicRuntimeConfig?.accountId;

const matomoUrlByAccountId = {
  [AccountId.HMS]: 'https://cellenics.matomo.cloud',
  [AccountId.BIOMAGE]: 'https://biomage.matomo.cloud',
};

const MATOMO_URL = matomoUrlByAccountId[accountId];

// To test a staging deployment, you'll need to go to matomo.cloud
// and change the URL there to point to your staging env URL.
// To test locally, just enable the development environemnt.
// The Site Ids are defined in matomo.cloud
const trackingInfoByAccountId = {
  [AccountId.BIOMAGE]: {
    [Environment.PRODUCTION]: {
      enabled: true,
      siteId: 1,
      containerId: 'lkIodjnO',
    },
    [Environment.STAGING]: {
      enabled: false,
      siteId: 2,
      containerId: 'FX7UBNS6',
    },
    [Environment.DEVELOPMENT]: {
      enabled: false,
      siteId: 3,
      containerId: 'lS8ZRMXJ',
    },
  },
  [AccountId.HMS]: {
    [Environment.PRODUCTION]: {
      enabled: true,
      siteId: 1,
      containerId: 'zdMhc9ey',
    },
    [Environment.STAGING]: {
      enabled: false,
      siteId: 2,
      containerId: 'lMoIVl5D',
    },
    [Environment.DEVELOPMENT]: {
      enabled: false,
      siteId: 3,
      containerId: 'uMEoPBAl',
    },
  },
};

const trackingInfo = trackingInfoByAccountId[accountId];

let env = Environment.DEVELOPMENT;

const getTrackingDetails = (e) => ({ ...trackingInfo[e], accountId });

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
