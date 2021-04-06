import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { resetEmbedding } from '../../../../redux/actions/embedding';
import { EMBEDDINGS_RESET } from '../../../../redux/actionTypes/embeddings';
import { initialEmbeddingState } from '../../../../redux/reducers/embeddings/initialState';

jest.mock('localforage');

const mockStore = configureStore([thunk]);

describe('resetEmbedding action', () => {
  const embeddingType = 'umap';

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Dispatches actions correctly', async () => {
    const store = mockStore(
      {
        embeddings:
          { [embeddingType]: { ...initialEmbeddingState, loading: false } },
      },
    );

    store.dispatch(resetEmbedding());

    const actions = store.getActions();

    expect(actions.length).toEqual(1);
    expect(actions[0].type).toEqual(EMBEDDINGS_RESET);
  });
});
