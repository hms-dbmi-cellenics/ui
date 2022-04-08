import loadEnvironment from 'redux/actions/networkResources/loadEnvironment';
import { ssrGetCurrentEnvironment } from 'utils/environment';

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
