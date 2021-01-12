import { GENES_EXPRESSION_TYPE_UPDATE } from '../../actionTypes/genes';
import loadGeneExpression from './loadGeneExpression';

const updateGeneExpressionType = (experimentId, expressionType) => async (dispatch, getState) => {
  const {
    views,
  } = getState().genes.expression;

  // Dispatch update gene expression type
  dispatch({
    type: GENES_EXPRESSION_TYPE_UPDATE,
    payload: {
      expressionType,
    },
  });

  // Get components currently using the gene data, then update the components
  Object.keys(views).forEach((componentUuid) => {
    dispatch(
      loadGeneExpression(
        experimentId,
        views[componentUuid].data,
        componentUuid,
        expressionType,
        true,
      ),
    );
  });
};

export default updateGeneExpressionType;
