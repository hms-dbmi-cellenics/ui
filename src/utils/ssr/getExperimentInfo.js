import fetchAPI from 'utils/http/fetchAPI';
import updateExperimentInfo from 'redux/actions/experimentSettings/updateExperimentInfo';

import config from 'config';
import { api } from 'utils/constants';
import APIError from 'utils/http/errors/APIError';
import httpStatusCodes from 'utils/http/httpStatusCodes';

const toApiV1 = (experimentV2) => {
  const {
    id, name, samplesOrder, pipelines, ...restOfExperiment
  } = experimentV2;

  const pipelinesV1 = {
    gem2s: pipelines.gem2s,
    pipeline: pipelines.qc,
  };

  const experimentV1 = {
    ...restOfExperiment,
    experimentId: id,
    experimentName: name,
    projectId: id,
    sampleIds: samplesOrder,
    meta: pipelinesV1,
    // These are always created with the same value right now
    // when the UI is updated:
    //  - Organism is not going to be used anymore.
    //  - Type will be defined in the samples, not in the experiment.
    organism: null,
    type: '10x',
  };

  return experimentV1;
};

const getExperimentInfo = async (context, store, Auth) => {
  const { req, query } = context;
  const { experimentId } = query;
  if (
    store.getState().apiUrl
    && store.getState().experimentSettings.info.experimentId === experimentId
  ) {
    return;
  }

  let user;
  try {
    user = await Auth.currentAuthenticatedUser();
  } catch (e) {
    if (e === 'The user is not authenticated') {
      throw new APIError(httpStatusCodes.UNAUTHORIZED);
    }
    throw e;
  }

  const jwt = user.getSignInUserSession().getIdToken().getJwtToken();

  const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

  let experimentData;
  if (config.currentApiVersion === api.V1) {
    experimentData = await fetchAPI(
      `/v1/experiments/${experimentId}`,
      {},
      { uiUrl: url, jwt },
    );
  } else if (config.currentApiVersion === api.V2) {
    const experimentDataV2 = await fetchAPI(
      `/v2/experiments/${experimentId}`,
      {},
      { uiUrl: url, jwt },
    );

    experimentData = toApiV1(experimentDataV2);
  }

  store.dispatch(updateExperimentInfo(experimentData));
  return {};
};

export default getExperimentInfo;
