import { EMBEDDINGS_LOADING, EMBEDDINGS_LOADED, EMBEDDINGS_ERROR } from 'redux/actionTypes/embeddings';
import fetchWork from 'utils/work/fetchWork';
import getTimeoutForWorkerTask from 'utils/getTimeoutForWorkerTask';

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

  // Does not load anything if experiment settings is not loaded
  const embeddingState = getState()
    .experimentSettings
    ?.processing
    ?.configureEmbedding
    ?.embeddingSettings;

  if (!embeddingState) return null;

  const { methodSettings } = embeddingState;

  // Set up loading state.
  dispatch({
    type: EMBEDDINGS_LOADING,
    payload: {
      embeddingType,
    },
  });

  const body = {
    name: 'GetEmbedding',
    type: embeddingType,
    config: methodSettings[embeddingType],
  };

  const timeout = getTimeoutForWorkerTask(getState(), 'GetEmbedding', { type: embeddingType });

  try {
    const data = await fetchWork(
      experimentId, body, getState, dispatch, { timeout },
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
