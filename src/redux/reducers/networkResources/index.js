import { HYDRATE } from 'next-redux-wrapper';
import {
  NETWORK_RESOURCES_DEPLOYMENT_INFO_LOADED,
} from '../../actionTypes/networkResources';

import initialState from './initialState';
import deploymentInfoLoaded from './deploymentInfoLoaded';
import environmentHydrate from './environmentHydrate';

const networkResourcesReducer = (state = initialState, action) => {
  switch (action.type) {
    case NETWORK_RESOURCES_DEPLOYMENT_INFO_LOADED: {
      return deploymentInfoLoaded(state, action);
    }

    case HYDRATE: {
      return environmentHydrate(state, action);
    }

    default: {
      return state;
    }
  }
};

export default networkResourcesReducer;
