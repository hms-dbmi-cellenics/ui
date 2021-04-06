import {
  EMBEDDINGS_RESET,
} from '../../actionTypes/embeddings';

const resetEmbedding = () => async (dispatch) => dispatch({
  type: EMBEDDINGS_RESET,
});

export default resetEmbedding;
