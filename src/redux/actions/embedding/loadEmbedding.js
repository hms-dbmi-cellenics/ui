import { EMBEDDINGS_LOADING, EMBEDDINGS_LOADED, EMBEDDINGS_ERROR } from '../../actionTypes/embeddings';
import { fetchWork } from '../../../utils/work/fetchWork';

const loadEmbedding = (
  experimentId,
  embeddingType,
  forceReload = false,
) => async (dispatch, getState) => {
  // If a previous load was initiated, hold off on it until that one is executed.
  if (!forceReload && (
    getState().embeddings[embeddingType]?.loading
    || getState().embeddings[embeddingType]?.data.length
  )) {
    return null;
  }

  const { status } = getState().backendStatus[experimentId];

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
  };

  try {
    const data = await fetchWork(
      experimentId, body, status, { timeout: 5 * 60 },
    );
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
