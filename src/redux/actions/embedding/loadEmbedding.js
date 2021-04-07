import { EMBEDDINGS_LOADING, EMBEDDINGS_LOADED, EMBEDDINGS_ERROR } from '../../actionTypes/embeddings';
import { fetchCachedWork } from '../../../utils/cacheRequest';

const TIMEOUT_SECONDS = 90;

const loadEmbedding = (experimentId, embeddingType) => async (dispatch, getState) => {
  // If a previous load was initiated, hold off on it until that one is executed.
  if (getState().embeddings[embeddingType]?.loading
    || getState().embeddings[embeddingType]?.data.length) {
    return null;
  }

  const { pipeline } = getState().experimentSettings.pipelineStatus.status;

  if (!pipeline?.startDate) {
    return null;
  }

  // Does not load anything if experiment settings is not loaded
  const embeddingState = getState()
    .experimentSettings
    ?.processing
    ?.configureEmbedding
    ?.embeddingSettings;

  if (!embeddingState) return null;

  const { methodSettings } = embeddingState;

  // Set up loading state.
  await dispatch({
    type: EMBEDDINGS_LOADING,
    payload: {
      experimentId,
      embeddingType,
    },
  });

  // TODO: this `embeddingType` will be changed to an embedding ID created during pre-processing.
  const body = {
    name: 'GetEmbedding',
    type: embeddingType,
    config: methodSettings[embeddingType],
    lastRun: pipeline.startDate,
  };

  try {
    const data = await fetchCachedWork(experimentId, TIMEOUT_SECONDS, body, 3600, 1);
    return dispatch({
      type: EMBEDDINGS_LOADED,
      payload: {
        experimentId,
        embeddingType,
        data,
      },
    });
  } catch (error) {
    return dispatch({
      type: EMBEDDINGS_ERROR,
      payload: {
        experimentId,
        embeddingType,
        error,
      },
    });
  }
};

export default loadEmbedding;
