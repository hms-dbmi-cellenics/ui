import embeddingsReducer from '../../../redux/reducers/embeddingsReducer';
import initialState, { initialEmbeddingState } from '../../../redux/reducers/embeddingsReducer/initialState';

import {
  EMBEDDINGS_ERROR, EMBEDDINGS_LOADED, EMBEDDINGS_LOADING,
} from '../../../redux/actionTypes/embeddings';

const experimentId = 'asdsa';
const embeddingType = 'fghfgdh';

describe('embeddingsReducer', () => {
  it('Reduces identical state on unknown action', () => expect(
    embeddingsReducer(undefined, {
      action: 'well/this/is/not/a/valid/action',
      payload: {},
    }),
  ).toEqual(initialState));

  it('Sets up store for embedding when loading starts', () => {
    const newState = embeddingsReducer({ ...initialState, loading: false }, {
      type: EMBEDDINGS_LOADING,
      payload: {
        experimentId,
        embeddingType,
      },
    });

    expect(newState).toMatchObject({
      [embeddingType]: {
        ...initialEmbeddingState,
      },
    });
  });

  it('Sets up store properly for loaded cell sets.', () => {
    const data = [[1, 2], [3, 4], [5, 6]];

    const newState = embeddingsReducer(initialState, {
      type: EMBEDDINGS_LOADED,
      payload: {
        experimentId,
        embeddingType,
        data,
      },
    });

    expect(newState).toMatchObject({
      [embeddingType]: {
        ...initialEmbeddingState,
        loading: false,
        data,
      },
    });
  });

  it('Loads up sparse array for sparse embedding data.', () => {
    const data = [[1, 2], null, [5, 6]];

    const newState = embeddingsReducer(initialState, {
      type: EMBEDDINGS_LOADED,
      payload: {
        experimentId,
        embeddingType,
        data,
      },
    });

    let iterableElements = 0;

    newState[embeddingType].data.forEach(() => {
      iterableElements += 1;
    });

    expect(iterableElements).toEqual(2);
  });

  it('Sets error conditions', () => {
    const newState = embeddingsReducer(initialState, {
      type: EMBEDDINGS_ERROR,
      payload: {
        experimentId,
        embeddingType,
        error: 'wow, something really bad happened',
      },
    });

    expect(newState).toMatchObject({
      [embeddingType]: {
        ...initialEmbeddingState,
        loading: false,
        error: 'wow, something really bad happened',
      },
    });
  });
});
