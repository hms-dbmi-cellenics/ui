import { HYDRATE } from 'next-redux-wrapper';
import {
  NETWORK_RESOURCES_LOAD_ENVIRONMENT,
} from '../../actionTypes/networkResources';

import initialState from './initialState';
import loadEnvironment from './loadEnvironment';
import environmentHydrate from './environmentHydrate';

const networkResourcesReducer = (state = initialState, action) => {
  switch (action.type) {
    case NETWORK_RESOURCES_LOAD_ENVIRONMENT: {
      return loadEnvironment(state, action);
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
