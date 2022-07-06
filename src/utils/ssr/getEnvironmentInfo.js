import loadEnvironment from 'redux/actions/networkResources/loadEnvironment';
import { ssrGetCurrentEnvironment } from 'utils/environment';
import getAWSRegion from 'utils/getAWSRegion';

const getAuthenticationInfo = async (context, store) => {
  if (
    store.getState().networkResources.environment
  ) {
    return;
  }

  const env = ssrGetCurrentEnvironment();
  const region = getAWSRegion(env);
  const { DOMAIN_NAME, AWS_REGION, DEFAULT_REGION } = process.env;

  console.log('ENV IS ', AWS_REGION, process.env.AWS_DEFAULT_REGION, DOMAIN_NAME, DEFAULT_REGION);
  store.dispatch(loadEnvironment(env));

  return {};
};

export default getAuthenticationInfo;
