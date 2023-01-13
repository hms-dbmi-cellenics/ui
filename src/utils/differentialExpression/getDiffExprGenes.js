/* eslint-disable no-param-reassign */
import { generateDiffExprBody } from 'redux/actions/differentialExpression/loadDifferentialExpression';

import fetchWork from 'utils/work/fetchWork';
import getTimeoutForWorkerTask from 'utils/getTimeoutForWorkerTask';

const getDiffExprGenes = (getAllGenes, numGenes) => async (dispatch, getState) => {
  const { experimentId } = getState().experimentSettings.info;
  const {
    type: comparisonType,
    group: comparisonGroup,
    ordering,
    advancedFilters,
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

  if (advancedFilters.length > 0) {
    pagination.filters = advancedFilters;
  }

  const body = generateDiffExprBody(
    experimentId,
    comparisonGroup[comparisonType],
    comparisonType,
    { genesOnly: true },
  );

  const timeout = getTimeoutForWorkerTask(getState(), 'DifferentialExpression');

  try {
    const result = await fetchWork(
      experimentId, body, getState, dispatch, { timeout, extras: { pagination } },
    );

    return result;
  } catch (error) {
    throw new Error(error);
  }
};

export default getDiffExprGenes;
