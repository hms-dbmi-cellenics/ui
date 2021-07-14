import { MARKER_GENES_LOADED } from '../../actionTypes/genes';

const markerGenesLoaded = (
  experimentId, loadedGeneExpressions,
) => async (dispatch) => {
  dispatch({
    type: MARKER_GENES_LOADED,
    payload: {
      experimentId,
      genes: Object.keys(loadedGeneExpressions),
      data: loadedGeneExpressions,
    },
  });
};

export default markerGenesLoaded;
