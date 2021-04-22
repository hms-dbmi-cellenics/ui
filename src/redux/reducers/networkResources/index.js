import { HYDRATE } from 'next-redux-wrapper';
import {
  NETWORK_RESOURCES_LOAD_ENVIRONMENT,
} from '../../actionTypes/networkResources';

import initialState from './initialState';
import networkResourcesLoadEnvironment from './networkResourcesLoadEnvironment';

const networkResourcesReducer = (state = initialState, action) => {
  switch (action.type) {
    case NETWORK_RESOURCES_LOAD_ENVIRONMENT: {
      return networkResourcesLoadEnvironment(state, action);
    }

    case HYDRATE: {
      const { environment } = action.payload.networkResources;

      let newState = { ...state };

      if (environment) {
        newState = { ...newState, environment };
      }

      return newState;
    }

    default: {
      return state;
    }
  }
};

export default networkResourcesReducer;
