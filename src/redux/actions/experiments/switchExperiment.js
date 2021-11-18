import { CELL_SETS_LOADED } from 'redux/actionTypes/cellSets';
import { EMBEDDINGS_LOADED } from 'redux/actionTypes/embeddings';

const switchExperiment = () => async (dispatch) => {
  dispatch({
    type: CELL_SETS_LOADED,
    payload: { reset: true },
  });
  dispatch({
    type: EMBEDDINGS_LOADED,
    payload: { reset: true },
  });
};
export default switchExperiment;
