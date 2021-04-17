import { HYDRATE } from 'next-redux-wrapper';
import {
  NETWORK_RESOURCES_API_URL_LOADED, NETWORK_RESOURCES_AUTH_LOADED,
} from '../../actionTypes/networkResources';

import initialState from './initialState';
import networkResourcesApiUrlLoaded from './networkResourcesApiUrlLoaded';
import networkResourcesAuthLoaded from './networkResourcesAuthLoaded';

const notificationsReducer = (state = initialState, action) => {
  switch (action.type) {
    case NETWORK_RESOURCES_API_URL_LOADED: {
      return networkResourcesApiUrlLoaded(state, action);
    }

    case NETWORK_RESOURCES_AUTH_LOADED: {
      return networkResourcesAuthLoaded(state, action);
    }

    case HYDRATE: {
      const { apiUrl, auth } = action.payload.networkResources;

      let newState = { ...state };

      if (apiUrl) {
        newState = { ...newState, apiUrl };
      }

      if (auth.userPoolId && auth.identityPoolId) {
        newState = { ...newState, auth };
      }

      return newState;
    }

    default: {
      return state;
    }
  }
};

export default notificationsReducer;
