import { MARKER_GENES_LOADED } from '../../actionTypes/genes';

const markerGenesLoaded = (
  experimentId, loadedGeneExpressions, orderedGenes,
) => async (dispatch) => {
  dispatch({
    type: MARKER_GENES_LOADED,
    payload: {
      experimentId,
      genes: orderedGenes,
      data: loadedGeneExpressions,
    },
  });
};

export default markerGenesLoaded;
