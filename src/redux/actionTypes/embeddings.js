const EMBEDDINGS = 'embeddings';

/**
 * Turns on the loading condition for the embedding.
 */
const EMBEDDINGS_LOADING = `${EMBEDDINGS}/loading`;

/**
 * Sets the state of the embedding to be successfully loaded, with the appropriate embedding data.
 */
const EMBEDDINGS_LOADED = `${EMBEDDINGS}/loaded`;

/**
 * Sets an error condition for a specific embedding.
 */
const EMBEDDINGS_ERROR = `${EMBEDDINGS}/error`;

export { EMBEDDINGS_LOADING, EMBEDDINGS_LOADED, EMBEDDINGS_ERROR };
