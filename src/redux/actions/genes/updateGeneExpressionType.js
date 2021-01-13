import { GENES_EXPRESSION_TYPE_UPDATE } from '../../actionTypes/genes';
import loadGeneExpression from './loadGeneExpression';

const updateGeneExpressionType = (experimentId, expressionType) => async (dispatch, getState) => {
  const {
    views,
  } = getState().genes.expression;

  // Get components currently using the gene data, then update the components
  const updates = Object.keys(views).map((componentUuid) => dispatch(
    loadGeneExpression(
      experimentId,
      views[componentUuid].data,
      componentUuid,
      expressionType,
      true,
    ),
  ));

  // Dispatch update gene expression after all updates are done
  if (updates.length > 0) {
    await Promise.all(updates);
  }

  dispatch({
    type: GENES_EXPRESSION_TYPE_UPDATE,
    payload: {
      expressionType,
    },
  });
};

export default updateGeneExpressionType;
