import { init, push } from '@socialgouv/matomo-next';
import { Auth } from 'aws-amplify';
import Env from './environment';

const MATOMO_URL = 'https://biomage.matomo.cloud/';

// To test a staging deployment, you'll need to go to biomage.matomo.cloud
// and change the URL there to point to your staging env URL.
// To test locally, just enable the development environemnt.
// The Site Ids are defined in biomage.matomo.cloud
const trackingInfo = {
  [Env.PRODUCTION]: {
    enabled: true,
    siteId: 1,
  },
  [Env.STAGING]: {
    enabled: false,
    siteId: 2,
  },
  [Env.DEVELOPMENT]: {
    enabled: false,
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

const trackAnalysisLaunched = () => {
  const { enabled } = getTrackingDetails(env);
  if (enabled === false) {
    return;
  }
  // Matomo events consist of four primary components which need to be configured,
  // only two of which are required:
  // * Category(Required) , and Form Events.
  // * Action(Required)
  // * Name(Optional – Recommended)
  // * Value(Optional)
  // See https://matomo.org/docs/event-tracking/ for more info
  push(['trackEvent', 'data-management', 'launch-analysis']);
};

export {
  initTracking, resetTrackingId, trackAnalysisLaunched,
};
