import { NETWORK_RESOURCES_API_URL_LOADED } from '../../actionTypes/networkResources';

const loadAPIUrl = (apiUrl) => (dispatch) => {
  dispatch({
    type: NETWORK_RESOURCES_API_URL_LOADED,
    payload: {
      apiUrl,
    },
  });
};

export default loadAPIUrl;
