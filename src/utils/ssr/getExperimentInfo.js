import getApiEndpoint from '../apiEndpoint';
import loadAPIUrl from '../../redux/actions/networkResources/loadAPIUrl';
import getFromApiExpectOK from '../getFromApiExpectOK';

const getExperimentInfo = async (context, store) => {
  const { req, query } = context;
  const { experimentId } = query;

  if (store.getState().apiUrl) {
    return;
  }

  const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  const apiUrl = getApiEndpoint(url);

  const experimentData = await getFromApiExpectOK(`${apiUrl}/v1/experiments/${experimentId}`);

  store.dispatch(loadAPIUrl(apiUrl));
  return { experimentId, experimentData };
};

export default getExperimentInfo;
