import { Environment, isBrowser } from 'utils/deploymentInfo';
import { getBackendStatus } from 'redux/selectors';

import cache from 'utils/cache';
import { dispatchWorkRequest, seekFromS3 } from 'utils/work/seekWorkResponse';
import generateETag from 'utils/work/generateETag';

// const decomposeBody = async (body, experimentId) => {
//   const { genes: requestedGenes } = body;
//   const missingDataKeys = {};
//   const cachedData = {};

//   await Promise.all(requestedGenes.map(async (g) => {
//     const newBody = {
//       ...body,
//       genes: g,
//     };

//     const key = createObjectHash({ experimentId, newBody });
//     const data = await cache.get(key);

//     if (data) {
//       cachedData[g] = data;
//     } else {
//       missingDataKeys[g] = key;
//     }
//   }));

//   return { missingDataKeys, cachedData };
// };

// Temporarily using gene expression without local cache
const fetchGeneExpressionWorkWithoutLocalCache = async (
  experimentId,
  timeout,
  body,
  backendStatus,
  environment,
  broadcast,
  extras,
) => {
  // If new genes are needed, construct payload, try S3 for results,
  // and send out to worker if there's a miss.
  const { pipeline: { startDate: qcPipelineStartDate } } = backendStatus;

  const ETag = generateETag(
    experimentId,
    body,
    extras,
    qcPipelineStartDate,
    environment,
  );

  // Then, we may be able to find this in S3.
  const response = await seekFromS3(ETag, experimentId);

  if (response) return response;

  // If there is no response in S3, dispatch workRequest via the worker
  try {
    await dispatchWorkRequest(
      experimentId,
      body,
      timeout,
      ETag,
      {
        ETagPipelineRun: qcPipelineStartDate,
        broadcast,
        ...extras,
      },
    );
  } catch (error) {
    console.error('Error dispatching work request: ', error);
    throw error;
  }

  return await seekFromS3(ETag, experimentId);
};

// const fetchGeneExpressionWork = async (
//   experimentId,
//   timeout,
//   body,
//   backendStatus,
//   environment,
//   broadcast,
//   extras,
// ) => {
//   // Get only genes that are not already found in local storage.
//   const { missingDataKeys, cachedData } = await decomposeBody(body, experimentId);

//   const missingGenes = Object.keys(missingDataKeys);

//   if (missingGenes.length === 0) {
//     return cachedData;
//   }

//   // If new genes are needed, construct payload, try S3 for results,
//   // and send out to worker if there's a miss.
//   const { pipeline: { startDate: qcPipelineStartDate } } = backendStatus;

//   const missingGenesBody = { ...body, genes: missingGenes };

//   const ETag = generateETag(
//     experimentId,
//     missingGenesBody,
//     extras,
//     qcPipelineStartDate,
//     environment,
//   );

//   // Then, we may be able to find this in S3.
//   let response = await seekFromS3(ETag, experimentId);

//   // If there is no response in S3, dispatch workRequest via the worker
//   if (!response) {
//     try {
//       await dispatchWorkRequest(
//         experimentId,
//         missingGenesBody,
//         timeout,
//         ETag,
//         {
//           ETagPipelineRun: qcPipelineStartDate,
//           broadcast,
//           ...extras,
//         },
//       );
//     } catch (error) {
//       console.error('Error dispatching work request: ', error);
//       throw error;
//     }
//   }

//   response = await seekFromS3(ETag, experimentId);

//   Object.keys(missingDataKeys).forEach(async (gene) => {
//     await cache.set(missingDataKeys[gene], response[gene]);
//   });

//   return response;
// };

const fetchWork = async (
  experimentId,
  body,
  getState,
  optionals = {},
) => {
  const {
    extras = undefined,
    timeout = 180,
    broadcast = false,
    isJson = true,
  } = optionals;

  const backendStatus = getBackendStatus(experimentId)(getState()).status;

  const { environment } = getState().networkResources;
  if (!isBrowser) {
    throw new Error('Disabling network interaction on server');
  }

  if (environment === Environment.DEVELOPMENT && !localStorage.getItem('disableCache')) {
    localStorage.setItem('disableCache', 'true');
  }

  const { pipeline: { startDate: qcPipelineStartDate } } = backendStatus;
  if (body.name === 'GeneExpression') {
    return fetchGeneExpressionWorkWithoutLocalCache(
      experimentId, timeout, body, backendStatus, environment, broadcast, extras,
    );
  }

  const ETag = generateETag(
    experimentId,
    body,
    extras,
    qcPipelineStartDate,
    environment,
  );

  // First, let's try to fetch this information from the local cache.
  const data = await cache.get(ETag);

  if (data) {
    return data;
  }

  // Then, we may be able to find this in S3.
  let response = await seekFromS3(ETag, experimentId, isJson);

  if (response) return response;

  // If there is no response in S3, dispatch workRequest via the worker
  try {
    await dispatchWorkRequest(
      experimentId,
      body,
      timeout,
      ETag,
      {
        PipelineRunETag: qcPipelineStartDate,
        broadcast,
        ...extras,
      },
    );

    response = await seekFromS3(ETag, experimentId, isJson);
  } catch (error) {
    console.error('Error dispatching work request', error);
    throw error;
  }

  await cache.set(ETag, response);

  return response;
};

export default fetchWork;
