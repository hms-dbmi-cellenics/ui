import { init, push } from '@socialgouv/matomo-next';
import { Auth } from 'aws-amplify';
import Env from './environment';

const MATOMO_URL = 'https://biomage.matomo.cloud/';

// To test a staging deployment, you'll need to go to biomage.matomo.cloud
// and change the URL there to point to your staging env URL.
// The Site Ids are defined in biomage.matomo.cloud
const trackingInfo = {
  [Env.PRODUCTION]: {
    enabled: true,
    siteId: 1,
  },
  [Env.STAGING]: {
    enabled: true,
    siteId: 2,
  },
  [Env.DEVELOPMENT]: {
    enabled: true,
    siteId: 3,
  },
};

let env = Env.DEVELOPMENT;

const getTrackingDetails = (e) => trackingInfo[e];

const initTracking = async (environment) => {
  // set the environment for the tracking sytem
  env = environment;
  const { siteId, enabled } = getTrackingDetails(env);
  if (enabled === false) {
    console.log(`tracking init disabled in env ${env}`);
    return;
  }

  const user = await Auth.currentAuthenticatedUser();
  // first set the user ID and then initialize the tracking so it correctly tracks first page.
  push(['setUserId', user.attributes.email]);
  init({ url: MATOMO_URL, siteId });

  console.log(`initialized tracking to ${siteId} for ${env}`);
};

const resetTrackingId = () => {
  const { enabled } = getTrackingDetails(env);
  if (enabled === false) {
    console.log(`setting tracking ID disabled in env ${env}`);
    return;
  }
  push(['resetUserId']);
  // we also force a new visit to be created for the pageviews after logout
  push(['appendToTrackingUrl', 'new_visit=1']);
};
// the push method takes as parameter t
const trackAnalysisLaunched = () => {
  const { enabled } = getTrackingDetails(env);
  if (enabled === false) {
    console.log(`tracking analysis launched disabled in env ${env}`);
    return;
  }
  console.log(`tracking analysis launched in ${env}`);
  push(['trackEvent', 'data-management', 'launch-analysis']);
};

export {
  initTracking, resetTrackingId, trackAnalysisLaunched,
};
