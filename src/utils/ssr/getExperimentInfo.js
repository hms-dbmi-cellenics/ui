import updateExperimentInfo from '../../redux/actions/experimentSettings/updateExperimentInfo';
import { getFromApiExpectOK } from '../getDataExpectOK';

const getExperimentInfo = async (context, store, Auth) => {
  const { req, query } = context;
  const { experimentId } = query;
  if (
    store.getState().apiUrl
    && store.getState().experimentSettings.info.experimentId === experimentId
  ) {
    return;
  }

  const user = await Auth.currentAuthenticatedUser();
  const jwt = user.getSignInUserSession().getIdToken().getJwtToken();

  const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  const experimentData = await getFromApiExpectOK(`/v1/experiments/${experimentId}`,
    {}, { uiUrl: url, jwt });

  store.dispatch(updateExperimentInfo(experimentData));
  return {};
};

export default getExperimentInfo;
