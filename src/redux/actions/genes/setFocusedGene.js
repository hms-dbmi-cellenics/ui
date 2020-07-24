import {
  GENES_FOCUS, GENES_UNFOCUS,
} from '../../actionTypes/genes';

const setFocusedGene = (
  experimentId, gene,
) => (dispatch) => {
  if (gene) {
    dispatch({
      type: GENES_FOCUS,
      payload: {
        experimentId,
        gene,
      },
    });
  } else {
    dispatch({
      type: GENES_UNFOCUS,
      payload: {
        experimentId,
      },
    });
  }
};

export default setFocusedGene;
