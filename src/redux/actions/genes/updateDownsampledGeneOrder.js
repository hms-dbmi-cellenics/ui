import { DOWNSAMPLED_GENES_EXPRESSION_UPDATE_GENE_ORDER } from 'redux/actionTypes/genes';

const updateDownsampledGeneOrder = (componentUuid, orderedGeneNames) => (dispatch) => {
  dispatch({
    type: DOWNSAMPLED_GENES_EXPRESSION_UPDATE_GENE_ORDER,
    payload: {
      componentUuid,
      orderedGeneNames,
    },
  });
};

export default updateDownsampledGeneOrder;
