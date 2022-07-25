import { NETWORK_RESOURCES_DEPLOYMENT_INFO_LOADED } from '../../actionTypes/networkResources';

const loadDeploymentInfo = ({ environment, domainName = undefined }) => (dispatch) => {
  dispatch({
    type: NETWORK_RESOURCES_DEPLOYMENT_INFO_LOADED,
    payload: {
      environment,
      domainName,
    },
  });
};

export default loadDeploymentInfo;
