import { GENES_EXPRESSION_LOADED } from '../../actionTypes/genes';

const genesExpressionLoaded = (
  experimentId, componentUuid, loadedGeneExpressions,
) => async (dispatch) => dispatch({
  type: GENES_EXPRESSION_LOADED,
  payload: {
    experimentId,
    componentUuid,
    genes: Object.keys(loadedGeneExpressions),
    data: loadedGeneExpressions,
  },
});

export default genesExpressionLoaded;
