import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import createCellSetByExpression from 'redux/actions/cellSets/createCellSetByExpression';

import fake from '__test__/test-utils/constants';

import fetchWork from 'utils/work/fetchWork';
import pushNotificationMessage from 'utils/pushNotificationMessage';
import endUserMessages from 'utils/endUserMessages';
import { waitFor } from '@testing-library/dom';

jest.mock('utils/work/fetchWork', () => (jest.fn(() => ({}))));
jest.mock('utils/pushNotificationMessage');

const mockStore = configureMockStore([thunk]);
const store = mockStore();
const experimentId = fake.EXPERIMENT_ID;

const mockData = [
  {
    geneName: 'GeneA',
    comparisonType: 'greaterThan',
    thresholdValue: '0.00',
  },
  {
    geneName: 'GeneB',
    comparisonType: 'lessThan',
    thresholdValue: '0.05',
  },
];

describe('createCellSetByExpression', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Dispatches the correct body', async () => {
    await store.dispatch(createCellSetByExpression(experimentId, mockData));

    const params = fetchWork.mock.calls[0];
    expect(params).toMatchSnapshot();
  });

  it('Throws notification on error', async () => {
    fetchWork.mockImplementationOnce(() => Promise.reject(new Error('some error')));

    expect(async () => {
      await store.dispatch(createCellSetByExpression(experimentId, mockData));
    }).rejects.toThrow();

    waitFor(() => {
      expect(pushNotificationMessage).toHaveBeenCalledTimes(1);
      expect(pushNotificationMessage).toHaveBeenCalledWith('error', endUserMessages.ERROR_FETCHING_CELL_SETS);
    });
  });
});
