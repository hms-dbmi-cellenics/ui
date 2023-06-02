import fetchWork from 'utils/work/fetchWork';
import getTimeoutForWorkerTask from 'utils/getTimeoutForWorkerTask';
import { getCellSetKey } from 'utils/cellSets';
import getArray from 'utils/getArray';
import pushNotificationMessage from 'utils/pushNotificationMessage';

const getBatchDiffExpr = (experimentId,
  comparison, chosenOperation, batchClusterNames) => async (dispatch, getState) => {
  const {
    cellSet, compareWith, comparisonType,
  } = comparison;

  let workBody = {};
  if (chosenOperation === 'fullList') {
    workBody = {
      name: 'BatchDifferentialExpression',
      experimentId,
      cellSet: batchClusterNames,
      compareWith: 'background',
      basis: ['all'],
      comparisonType,
    };
  } else {
    workBody = {
      name: 'BatchDifferentialExpression',
      experimentId,
      cellSet: [getCellSetKey(cellSet)],
      compareWith: getCellSetKey(compareWith),
      basis: batchClusterNames,
      comparisonType,
    };
  }

  const numberOfComparisons = batchClusterNames.length;
  const timeout = getTimeoutForWorkerTask(getState(), 'DifferentialExpression') * numberOfComparisons;

  try {
    const data = await fetchWork(
      experimentId, workBody, getState, dispatch, { timeout },
    );

    if (!data.length) {
      pushNotificationMessage('warning', 'No data available for this comparison, make sure the selected cell set is not empty');
    }

    const rows = data.map((row) => {
      if (!row.total) {
        return { error: row.data };
      }
      return getArray(row.data);
    });
    return rows;
  } catch (e) {
    pushNotificationMessage('error', 'Something went wrong while computing your data.');
    return { error: e };
  }
};
export default getBatchDiffExpr;
