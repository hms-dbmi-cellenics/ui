/* eslint-disable no-param-reassign */
import { generateDiffExprBody } from 'redux/actions/differentialExpression/loadDifferentialExpression';
import { fetchWork } from 'utils/work/fetchWork';
import getTimeoutForWorkerTask from 'utils/getTimeoutForWorkerTask';

const getPathwayAnalysisGenes = (getAllGenes, numGenes) => async (dispatch, getState) => {
  const { experimentId } = getState().experimentSettings.info;
  const {
    type: comparisonType,
    group: comparisonGroup,
    ordering,
  } = getState().differentialExpression.comparison;

  if (getAllGenes) {
    numGenes = getState().differentialExpression.properties.total;
  }

  const pagination = {
    orderBy: ordering.orderBy,
    orderDirection: ordering.orderDirection,
    offset: 0,
    limit: numGenes,
    responseKey: 0,
  };

  const body = generateDiffExprBody(
    experimentId,
    comparisonGroup[comparisonType],
    { genesOnly: true },
  );

  const timeout = getTimeoutForWorkerTask(getState(), 'DifferentialExpression');

  try {
    const data = await fetchWork(
      experimentId, body, getState, { timeout, extras: { pagination } },
    );

    const { rows } = data;

    return rows;
  } catch (error) {
    throw new Error(error);
  }
};

export default getPathwayAnalysisGenes;
