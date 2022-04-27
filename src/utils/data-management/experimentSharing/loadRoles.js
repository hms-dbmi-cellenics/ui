import fetchAPI from 'utils/http/fetchAPI';
import config from 'config';
import { api } from 'utils/constants';

const loadRoles = async (experimentId) => {
  let url;

  if (config.currentApiVersion === api.V1) {
    url = `/v1/access/${experimentId}`;
  } else if (config.currentApiVersion === api.V2) {
    url = `/v2/access/${experimentId}`;
  }

  return fetchAPI(url);
};

export default loadRoles;
