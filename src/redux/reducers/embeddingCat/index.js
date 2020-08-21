import EMBEDDING_CAT_CONFIG_UPDATE from '../../actionTypes/embeddingCat';
import initialState from './initialState';

const embeddingCatReducer = (state = initialState, action) => {
  switch (action.type) {
    case EMBEDDING_CAT_CONFIG_UPDATE:
      return {
        ...state,
        ...action.config,
      };
    default:
      return state;
  }
};

export default embeddingCatReducer;
