import { GENE_ORDER_SET } from '../../actionTypes/genes';

const setGeneOrder = (order) => (dispatch) => {
  dispatch({
    type: GENE_ORDER_SET,
    payload: {
      order,
    },
  });
};
export default setGeneOrder;
