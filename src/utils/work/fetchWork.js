import { isBrowser, Environment } from 'utils/deploymentInfo';

import { getBackendStatus } from 'redux/selectors';

import cache from 'utils/cache';
import seekWorkerResultsOrDispatchWork from 'utils/work/seekWorkResponse';
import getExtraDependencies from 'utils/work/getExtraDependencies';

const DISABLE_UNIQUE_KEYS = [
  'GetEmbedding',
];

const fetchWork = async (
  experimentId,
  body,
  getState,
  dispatch,
  optionals = {},
) => {
  const {
    extras = undefined,
    timeout = 180,
    broadcast = false,
    onETagGenerated = () => { },
  } = optionals;

  const backendStatus = getBackendStatus(experimentId)(getState()).status;

  if (!isBrowser) {
    throw new Error('Disabling network interaction on server');
  }

  const { environment } = getState().networkResources;
  let cacheUniquenessKey = null;

  if (
    environment !== Environment.PRODUCTION
    && (!localStorage.getItem('disableCache') || localStorage.getItem('disableCache') === 'true')
    && !DISABLE_UNIQUE_KEYS.includes(body.name)
  ) {
    cacheUniquenessKey = Math.random();
  }

  if (environment === Environment.DEVELOPMENT && !localStorage.getItem('disableCache')) {
    localStorage.setItem('disableCache', 'true');
  }

  const { pipeline: { startDate: qcPipelineStartDate } } = backendStatus;

  const requestProps = {
    ETagPipelineRun: qcPipelineStartDate,
    broadcast,
    ...extras,
  };

  const extraDependencies = await getExtraDependencies(
    experimentId, body, dispatch, getState,
  );

  const ETagProps = {
    experimentId,
    body,
    extras,
    cacheUniquenessKey,
    extraDependencies,
  };

  const { ETag, data } = await seekWorkerResultsOrDispatchWork(
    experimentId,
    body,
    timeout,
    requestProps,
    ETagProps,
    onETagGenerated,
    dispatch,
  );

  if (body.name !== 'GeneExpression') {
    await cache.set(ETag, data);
  }

  return data;
};

export default fetchWork;
