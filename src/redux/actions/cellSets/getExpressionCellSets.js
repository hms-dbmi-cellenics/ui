import { fetchWork } from 'utils/work/fetchWork';

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
    throw new Error(e);
  }
};

export default getCellSetsByExpression;
