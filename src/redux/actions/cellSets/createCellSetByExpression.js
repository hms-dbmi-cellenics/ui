import { fetchWork } from 'utils/work/fetchWork';
import pushNotificationMessage from 'utils/pushNotificationMessage';
import endUserMessages from 'utils/endUserMessages';

const createCellSetByExpression = (
  experimentId, selectedGenes,
) => async (dispatch, getState) => {
  const body = {
    name: 'GetExpressionCellSets',
    genesConfig: selectedGenes,
  };

  try {
    const result = await fetchWork(experimentId, body, getState, { broadcast: true });
    return result;
  } catch (e) {
    console.error(e);
    pushNotificationMessage('error', endUserMessages.ERROR_FETCHING_CELL_SETS);
    throw new Error(e);
  }
};

export default createCellSetByExpression;
