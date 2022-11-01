import fetchWork from 'utils/work/fetchWork';
import pushNotificationMessage from 'utils/pushNotificationMessage';
import endUserMessages from 'utils/endUserMessages';
import WorkResponseError from 'utils/errors/http/WorkResponseError';

const createCellSetByExpression = (
  experimentId, selectedGenes,
) => async (dispatch, getState) => {
  const body = {
    name: 'GetExpressionCellSets',
    genesConfig: selectedGenes,
  };
  try {
    const data = await fetchWork(experimentId, body, getState, dispatch, { broadcast: true });
    return data;
  } catch (e) {
    let errorMessage = endUserMessages.ERROR_FETCHING_CELL_SETS;
    if (e instanceof WorkResponseError) errorMessage = e.userMessage;

    pushNotificationMessage('error', errorMessage);
    throw new Error(e);
  }
};

export default createCellSetByExpression;
