import { MD5 } from 'object-hash';

import { Environment } from 'utils/deploymentInfo';

import config from 'config';

const createObjectHash = (object) => MD5(object);

// Disable unique keys to reallow reuse of work results in development
const DISABLE_UNIQUE_KEYS = [
  'GetEmbedding',
];

const generateETag = (
  experimentId,
  body,
  extras,
  qcPipelineStartDate,
  environment,
  clusteringSettings = null,
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
    };
  } else {
    if (!clusteringSettings) {
      throw new Error('Clustering settings required to launch work request');
    }

    ETagBody = {
      experimentId,
      body,
      qcPipelineStartDate,
      extras,
      cacheUniquenessKey,
      clusteringSettings,
      workerVersion: config.workerVersion,
    };
  }

  return createObjectHash(ETagBody);
};

export default generateETag;
