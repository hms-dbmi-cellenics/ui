/* eslint-disable no-param-reassign */
import { generateDiffExprBody } from 'redux/actions/differentialExpression/loadDifferentialExpression';
import { fetchWork } from 'utils/work/fetchWork';
import getTimeoutForWorkerTask from 'utils/getTimeoutForWorkerTask';

const getBackgroundExpressedGenes = () => async (dispatch, getState) => {
  const { experimentId } = getState().experimentSettings.info;
  const {
    type: comparisonType,
    group: comparisonGroup,
  } = getState().differentialExpression.comparison;

  const body = generateDiffExprBody(
    experimentId,
    comparisonGroup[comparisonType],
    { name: 'GetBackgroundExpressedGenes' },
  );

  const timeout = getTimeoutForWorkerTask(getState(), 'DifferentialExpression');

  try {
    const data = await fetchWork(
      experimentId, body, getState, { timeout },
    );

    const { genes } = data;

    return genes;
  } catch (error) {
    throw new Error(error);
  }
};

export default getBackgroundExpressedGenes;
