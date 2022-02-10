import { fetchWork } from 'utils/work/fetchWork';
import pushNotificationMessage from 'utils/pushNotificationMessage';
import endUserMessages from 'utils/endUserMessages';

const getCellSetsByExpression = (experimentId, selectedGenes) => async (dispatch, getState) => {
  const body = {
    name: 'GetExpressionCellSets',
    genesConfig: selectedGenes,
  };

  try {
    const result = await fetchWork(experimentId, body, getState);
    return result;
  } catch (e) {
    console.error(e);
    pushNotificationMessage('error', endUserMessages.ERROR_FETCHING_CELL_SETS);
  }
};

export default getCellSetsByExpression;
