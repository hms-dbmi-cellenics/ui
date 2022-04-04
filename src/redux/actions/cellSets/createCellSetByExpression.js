import { fetchWork } from 'utils/work/fetchWork';
import pushNotificationMessage from 'utils/pushNotificationMessage';
import endUserMessages from 'utils/endUserMessages';
import WorkResponseError from 'utils/WorkResponseError';
import { createCellSet } from 'redux/actions/cellSets';

const createCellSetByExpression = (
  experimentId, selectedGenes,
) => async (dispatch, getState) => {
  const body = {
    name: 'GetExpressionCellSets',
    genesConfig: selectedGenes,
  };

  try {
    const result = await fetchWork(experimentId, body, getState);

    const { name, color, cellIds } = result;
    dispatch(createCellSet(
      experimentId, name, color, cellIds,
    ));

    return result;
  } catch (e) {
    let errorMessage = endUserMessages.ERROR_FETCHING_CELL_SETS;
    if (e instanceof WorkResponseError) errorMessage = e.userMessage;

    pushNotificationMessage('error', errorMessage);
    throw new Error(e);
  }
};

export default createCellSetByExpression;
