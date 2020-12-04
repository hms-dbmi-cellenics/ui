import {
  GENES_EXPRESSION_VIEW_LOADING, GENES_EXPRESSION_VIEW_LOADED,
} from '../../actionTypes/genes';
import loadGeneExpression from './loadGeneExpression';

const changeExpressionView = (
  experimentId, genes, componentUuid, overwrite = true,
) => async (dispatch, getState) => {
  const oldData = getState().genes.expression.views[componentUuid]?.data;

  let newData = genes;
  if (!overwrite && oldData) {
    newData = Array.from(new Set(genes.concat(oldData)));
  }

  // Dispatch loading state.
  dispatch({
    type: GENES_EXPRESSION_VIEW_LOADING,
    payload: {
      experimentId,
      genes: newData,
      componentUuid,
    },
  });

  if (genes.length > 0) {
    await dispatch(loadGeneExpression(experimentId, genes));
  }

  // Dispatch loaded state.
  dispatch({
    type: GENES_EXPRESSION_VIEW_LOADED,
    payload: {
      experimentId,
      genes,
      componentUuid,
    },
  });
};

export default changeExpressionView;
