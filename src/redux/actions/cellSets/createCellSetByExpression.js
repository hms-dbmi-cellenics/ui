import { fetchWork } from 'utils/work/fetchWork';

const createCellSetByExpression = (
  experimentId, selectedGenes,
) => async (dispatch, getState) => {
  const body = {
    name: 'GetExpressionCellSets',
    genesConfig: selectedGenes,
  };

  const result = await fetchWork(experimentId, body, getState, { broadcast: true });
  return result;
};

export default createCellSetByExpression;
