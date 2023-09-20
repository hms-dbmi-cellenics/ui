import { isBrowser } from 'utils/deploymentInfo';

import { getBackendStatus } from 'redux/selectors';

import cache from 'utils/cache';
import seekWorkerResultsOrDispatchWork from 'utils/work/seekWorkResponse.v2';
import getExtraDependencies from 'utils/work/getExtraDependencies';

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
    extraDependencies,
  };

  if (body.name === 'GeneExpression') {
    ETagProps.disableCache = true;
  }

  const { ETag, data } = await seekWorkerResultsOrDispatchWork(
    experimentId,
    body,
    timeout,
    requestProps,
    ETagProps,
    onETagGenerated,
    dispatch,
  );

  await cache.set(ETag, data);

  return data;
};

export default fetchWork;
