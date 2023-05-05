import {
  makeStore,
} from 'redux/store';
import fetchWork from 'utils/work/fetchWork';
import getTimeoutForWorkerTask from 'utils/getTimeoutForWorkerTask';
import pushNotificationMessage from 'utils/pushNotificationMessage';
import fake from '__test__/test-utils/constants';
import getBatchDiffExpr from 'utils/extraActionCreators/differentialExpression/getBatchDiffExpr';

jest.mock('utils/work/fetchWork');
jest.mock('utils/getTimeoutForWorkerTask');
jest.mock('utils/pushNotificationMessage');

const comparisonObject = {
  cellSet: 'cellSet',
  compareWith: 'compareWith',
  basis: 'basis',
  comparisonType: 'within',
};

const expectedResult = [
  {
    total: 3,
    data: [1, 2, 3],
  },
];

let store = null;

describe('getBatchDiffExpr test', () => {
  beforeEach(async () => {
    jest.clearAllMocks();

    store = makeStore();
    fetchWork.mockImplementation(() => Promise.resolve(expectedResult));
    getTimeoutForWorkerTask.mockReturnValue(1000);
  });

  it('Dispatches correctly', async () => {
    await store.dispatch(getBatchDiffExpr(fake.EXPERIMENT_ID, comparisonObject, 'fullList', ['louvain-1', 'louvain-2']));

    expect(fetchWork).toHaveBeenCalledTimes(1);

    const args = fetchWork.mock.calls[0];
    const body = args[1];

    // Checking body
    expect(body).toEqual(
      {
        basis: [
          'all',
        ],
        cellSet: [
          'louvain-1',
          'louvain-2',
        ],
        compareWith: 'background',
        comparisonType: 'within',
        experimentId: 'testae48e318dab9a1bd0bexperiment',
        name: 'BatchDifferentialExpression',
      },
    );
  });

  it('Shows a warning notification when there is no data', async () => {
    fetchWork.mockImplementation(() => Promise.resolve([]));

    await store.dispatch(getBatchDiffExpr(fake.EXPERIMENT_ID, comparisonObject, 'fullList', ['louvain-1', 'louvain-2']));

    expect(pushNotificationMessage).toHaveBeenCalledWith('warning', 'No data available for this comparison, make sure the selected cell set is not empty');
  });

  it('Shows an error notification and returns error object when an exception occurs', async () => {
    const error = new Error('Error');
    fetchWork.mockImplementation(() => Promise.reject(error));

    const result = await store.dispatch(getBatchDiffExpr(fake.EXPERIMENT_ID, comparisonObject, 'fullList', ['louvain-1', 'louvain-2']));

    expect(pushNotificationMessage).toHaveBeenCalledWith('error', 'Something went wrong while computing your data.');
    expect(result).toEqual({ error });
  });
});
