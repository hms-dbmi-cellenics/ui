import {
  GENES_SELECT, GENES_DESELECT,
} from '../../actionTypes/genes';

import GeneSelectionStatus from './geneSelectionStatus';

const changeGeneSelection = (
  experimentId, genes, status,
) => async (dispatch) => {
  if (status === GeneSelectionStatus.select) {
    dispatch({
      type: GENES_SELECT,
      payload: {
        experimentId,
        genes,
      },
    });
  } else if (status === GeneSelectionStatus.deselect) {
    dispatch({
      type: GENES_DESELECT,
      payload: {
        experimentId,
        genes,
      },
    });
  } else {
    throw new Error(`'selectOrDeselect' must be either 'select' or 'deselect', ${status} given.`);
  }
};

export default changeGeneSelection;
