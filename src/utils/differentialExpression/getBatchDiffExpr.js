import fetchWork from 'utils/work/fetchWork';
import getTimeoutForWorkerTask from 'utils/getTimeoutForWorkerTask';
import { getCellSetKey } from 'utils/cellSets';
import getArray from 'utils/getArray';

const getBatchDiffExpr = (experimentId, comparisonObject, comparisonType) => async (dispatch, getState) => {
  console.log('SENDING COMPARISON TYPE ', comparisonType);
  const workBody = {
    name: 'BatchDifferentialExpression',
    experimentId,
    cellSet: getCellSetKey(comparisonObject.cellSet),
    compareWith: getCellSetKey(comparisonObject.compareWith),
    basis: getCellSetKey(comparisonObject.basis),
    comparisonType,
  };

  const timeout = getTimeoutForWorkerTask(getState(), 'DifferentialExpression');

  const data = await fetchWork(
    experimentId, workBody, getState, dispatch, { timeout },
  );
  const rows = data.map((row) => getArray(row.data));
  return rows;
};
export default getBatchDiffExpr;
