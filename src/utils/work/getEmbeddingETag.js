import { getBackendStatus } from 'redux/selectors';
import generateETag from 'utils/work/generateETag';

const getEmbeddingETag = async (experimentId, getState, dispatch, inputEmbeddingMethod = null) => {
  const {
    clusteringSettings,
    embeddingSettings: { methodSettings, method: reduxEmbeddingMethod },
  } = getState().experimentSettings.processing.configureEmbedding;

  const { environment } = getState().networkResources;
  const {
    pipeline:
    { startDate: qcPipelineStartDate },
  } = getBackendStatus(experimentId)(getState()).status;

  const embeddingMethod = inputEmbeddingMethod ?? reduxEmbeddingMethod;

  const embeddingBody = {
    name: 'GetEmbedding',
    type: embeddingMethod,
    config: methodSettings[embeddingMethod],
  };

  const embeddingETag = await generateETag(
    experimentId,
    embeddingBody,
    undefined,
    qcPipelineStartDate,
    environment,
    clusteringSettings,
    dispatch,
    getState,
  );

  return embeddingETag;
};

export default getEmbeddingETag;
