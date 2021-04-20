import getApiEndpoint from '../apiEndpoint';
import updateExperimentInfo from '../../redux/actions/experimentSettings/updateExperimentInfo';
import getFromApiExpectOK from '../getFromApiExpectOK';

const getExperimentInfo = async (context, store) => {
  const { req, query } = context;
  const { experimentId } = query;

  if (
    store.getState().apiUrl
    && store.getState().experimentSettings.info.experimentId === experimentId
  ) {
    return;
  }

  const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  const apiUrl = getApiEndpoint(url);
  const experimentData = await getFromApiExpectOK(`${apiUrl}/v1/experiments/${experimentId}`);

  store.dispatch(updateExperimentInfo(experimentData));
  return {};
};

export default getExperimentInfo;
