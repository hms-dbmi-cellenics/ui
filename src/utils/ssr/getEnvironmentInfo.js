import { ssrGetCurrentEnvironment } from '../environment';
import loadEnvironment from '../../redux/actions/networkResources/loadEnvironment';

const getAuthenticationInfo = async (context, store) => {
  if (
    store.getState().networkResources.environment
  ) {
    return;
  }

  const env = ssrGetCurrentEnvironment();

  store.dispatch(loadEnvironment(env));

  return {};
};

export default getAuthenticationInfo;
