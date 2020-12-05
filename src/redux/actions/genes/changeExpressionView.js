import {
  GENES_EXPRESSION_VIEW_LOADING, GENES_EXPRESSION_VIEW_LOADED, GENES_EXPRESSION_VIEW_ERROR,
} from '../../actionTypes/genes';
import loadGeneExpression from './loadGeneExpression';

import { geneOperations } from '../../../utils/geneTable/geneOperations';

const changeExpressionView = (
  experimentId, genes, componentUuid, genesOperation,
) => async (dispatch, getState) => {
  const oldData = getState().genes.expression.views[componentUuid]?.data;

  let newData = genes;

  if (genesOperation === geneOperations.ADD && oldData) {
    newData = Array.from(new Set(genes.concat(oldData)));
  }
  if (genesOperation === geneOperations.REMOVE && oldData) {
    newData = oldData.filter((gene) => !genes.includes(gene));
  }
  if (genesOperation === geneOperations.OVERWRITE && oldData) {
    newData = genes;
  }

  // Dispatch loading state
  dispatch({
    type: GENES_EXPRESSION_VIEW_LOADING,
    payload: {
      experimentId,
      genes: newData,
      componentUuid,
    },
  });

  try {
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
  } catch (e) {
    // Dispatch error state.
    dispatch({
      type: GENES_EXPRESSION_VIEW_ERROR,
      payload: {
        experimentId,
        componentUuid,
        error: "Couldn't update the view of this component.",
      },
    });
  }
};

export default changeExpressionView;
