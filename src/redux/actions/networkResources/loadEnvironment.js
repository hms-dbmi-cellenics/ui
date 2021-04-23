import { NETWORK_RESOURCES_LOAD_ENVIRONMENT } from '../../actionTypes/networkResources';

const loadEnvironment = (environment) => (dispatch) => {
  dispatch({
    type: NETWORK_RESOURCES_LOAD_ENVIRONMENT,
    payload: {
      environment,
    },
  });
};

export default loadEnvironment;
