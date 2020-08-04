/**
 * The store has the following format:
 * {
 *    embeddingType: {
 *      data: [[5.5, 2.2], [3.3, 4.4]],
 *      loading: false,
 *      error: false
 *    }
 * }
 */

const initialEmbeddingState = {
  data: [],
  loading: true,
  error: false,
};

const initialState = {};

export { initialEmbeddingState };
export default initialState;
