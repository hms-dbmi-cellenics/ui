import loadDeploymentInfo from 'redux/actions/networkResources/loadDeploymentInfo';
import { ssrGetDeploymentInfo } from 'utils/deploymentInfo';

const getEnvironmentInfo = async (context, store) => {
  const { networkResources } = store.getState();
  if (networkResources.environment && networkResources.domainName) return;

  const { environment, domainName } = ssrGetDeploymentInfo();

  console.log('*** ssrGetDeploymentInfo.environment', environment);
  console.log('*** ssrGetDeploymentInfo.domainName', domainName);

  store.dispatch(loadDeploymentInfo({ environment, domainName }));

  return {};
};

export default getEnvironmentInfo;
