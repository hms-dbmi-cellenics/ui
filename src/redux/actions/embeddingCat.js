import EMBEDDING_CAT_CONFIG_UPDATE from '../actionTypes/embeddingCat';

const setEmbeddingCatConfig = (config) => (dispatch) => {
  dispatch({
    type: EMBEDDING_CAT_CONFIG_UPDATE,
    config,
  });
};

export default setEmbeddingCatConfig;
