import { Environment } from 'utils/deploymentInfo';
import config from 'config';
import getExtraDependencies from 'utils/work/getExtraDependencies';
import createObjectHash from './createObjectHash';

// Disable unique keys to reallow reuse of work results in development
const DISABLE_UNIQUE_KEYS = [
  'GetEmbedding',
];

const generateETag = async (
  experimentId,
  body,
  extras,
  qcPipelineStartDate,
  environment,
  dispatch,
  getState,
) => {
  // If caching is disabled, we add an additional randomized key to the hash so we never reuse
  // past results.
  let cacheUniquenessKey = null;

  if (
    environment !== Environment.PRODUCTION
    && localStorage.getItem('disableCache') === 'true'
    && !DISABLE_UNIQUE_KEYS.includes(body.name)
  ) {
    cacheUniquenessKey = Math.random();
  }

  const extraDependencies = await getExtraDependencies(
    experimentId, body, dispatch, getState,
  );

  let ETagBody;

  // They `body` key to create ETAg for gene expression is different
  // from the others, causing the generated ETag to be different
  if (body.name === 'GeneExpression') {
    ETagBody = {
      experimentId,
      missingGenesBody: body,
      qcPipelineStartDate,
      extras,
      cacheUniquenessKey,
      workerVersion: config.workerVersion,
      extraDependencies,
    };
  } else {
    ETagBody = {
      experimentId,
      body,
      qcPipelineStartDate,
      extras,
      cacheUniquenessKey,
      workerVersion: config.workerVersion,
      extraDependencies,
    };
  }

  return createObjectHash(ETagBody);
};

export default generateETag;
