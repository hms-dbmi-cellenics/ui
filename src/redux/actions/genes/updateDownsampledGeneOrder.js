import { HEATMAP_GENES_EXPRESSION_UPDATE_GENE_ORDER } from 'redux/actionTypes/genes';

const updateDownsampledGeneOrder = (componentUuid, orderedGeneNames) => (dispatch) => {
  dispatch({
    type: HEATMAP_GENES_EXPRESSION_UPDATE_GENE_ORDER,
    payload: {
      componentUuid,
      orderedGeneNames,
    },
  });
};

export default updateDownsampledGeneOrder;
