import loadDeploymentInfo from 'redux/actions/networkResources/loadDeploymentInfo';
import { ssrGetDeploymentInfo } from 'utils/deploymentInfo';

const getEnvironmentInfo = async (context, store) => {
  if (
    store.getState().networkResources.environment
  ) {
    return;
  }

  const { environment, domainName } = ssrGetDeploymentInfo();

  store.dispatch(loadDeploymentInfo({ environment, domainName }));

  return {};
};

export default getEnvironmentInfo;
