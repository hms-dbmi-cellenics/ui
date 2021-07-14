import { MARKER_GENES_ERROR } from '../../actionTypes/genes';

const markerGenesError = (experimentId, error) => async (dispatch) => {
  dispatch({
    type: MARKER_GENES_ERROR,
    payload: {
      experimentId,
      error,
    },
  });
};

export default markerGenesError;
