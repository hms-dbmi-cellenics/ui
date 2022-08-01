import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { fetchWork } from 'utils/work/fetchWork';
import loadDifferentialExpression from 'redux/actions/differentialExpression/loadDifferentialExpression';

import initialState from 'redux/reducers/differentialExpression/initialState';

import {
  DIFF_EXPR_LOADING, DIFF_EXPR_LOADED, DIFF_EXPR_ERROR,
} from 'redux/actionTypes/differentialExpression';

import '__test__/test-utils/setupTests';

jest.mock('utils/work/fetchWork');

jest.mock('utils/getTimeoutForWorkerTask', () => ({
  __esModule: true, // this property makes it work
  default: () => 60,
}));

const mockStore = configureStore([thunk]);

describe('loadDifferentialExpression action', () => {
  const experimentId = '1234';
  const cellSets = {
    cellSet: 'louvain/louvain-0',
    compareWith: 'louvain/louvain-1',
    basis: 'condition/condition-control',
  };
  const comparisonType = 'within';

  const defaultTableState = {
    geneNamesFilter: null,
    pagination: {
      current: 1, pageSize: 50, showSizeChanger: true, total: 0,
    },
    sorter: { field: 'p_val_adj', columnKey: 'p_val_adj', order: 'ascend' },
  };

  const backendStatus = {
    [experimentId]: {
      status: {
        pipeline: {
          startDate: '2021-01-01T00:00:00',
        },
      },
    },
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Dispatches appropriately on failure', async () => {
    const store = mockStore({
      differentialExpression: {
        ...initialState,
      },
      backendStatus,
    });
    fetchWork.mockImplementationOnce(() => new Promise((resolve, reject) => reject(new Error('random error!'))));

    await store.dispatch(
      loadDifferentialExpression(experimentId, cellSets, comparisonType, defaultTableState),
    );

    const loadingAction = store.getActions()[0];
    expect(loadingAction.type).toEqual(DIFF_EXPR_LOADING);

    expect(fetchWork).toHaveBeenCalledTimes(1);
    expect(fetchWork).toHaveBeenCalledWith('1234',
      {
        cellSet: 'louvain-0',
        compareWith: 'louvain-1',
        basis: 'condition-control',
        comparisonType: 'within',
        name: 'DifferentialExpression',
        experimentId: '1234',
      },
      store.getState,
      {
        extras: {
          pagination: {
            limit: 50, offset: 0, orderBy: 'p_val_adj', orderDirection: 'ASC', responseKey: 0,
          },
        },
        timeout: 60,
      });
    expect(loadingAction).toMatchSnapshot();

    const loadedAction = store.getActions()[1];
    expect(loadedAction.type).toEqual(DIFF_EXPR_ERROR);
    expect(loadedAction).toMatchSnapshot();
  });

  it('Dispatches appropriately on success', async () => {
    const store = mockStore({
      differentialExpression: {
        ...initialState,
      },
      backendStatus,
    });

    fetchWork.mockImplementationOnce(() => {
      const resolveWith = {
        rows: [
          {
            p_val: 1.16, p_val_adj: 2.16, logFC: 3.45, gene_names: 'A',
          },
          {
            p_val: 2.16, p_val_adj: 3.16, logFC: 4.45, gene_names: 'B',
          },
          {
            p_val: 3.16, p_val_adj: 4.16, logFC: 5.45, gene_names: 'C',
          },
          {
            p_val: 4.16, p_val_adj: 5.16, logFC: 6.45, gene_names: 'D',
          },
          {
            p_val: 5.16, p_val_adj: 6.16, logFC: 7.45, gene_names: 'E',
          },
          {
            p_val: 6.16, p_val_adj: 7.16, logFC: 8.45, gene_names: 'F',
          },
        ],
      };

      return new Promise((resolve) => resolve({ data: resolveWith }));
    });

    await store.dispatch(
      loadDifferentialExpression(experimentId, cellSets, comparisonType, defaultTableState),
    );

    const loadingAction = store.getActions()[0];
    expect(loadingAction.type).toEqual(DIFF_EXPR_LOADING);
    expect(loadingAction).toMatchSnapshot();

    expect(fetchWork).toHaveBeenCalledTimes(1);
    expect(fetchWork).toHaveBeenCalledWith('1234',
      {
        cellSet: 'louvain-0',
        compareWith: 'louvain-1',
        basis: 'condition-control',
        comparisonType: 'within',
        name: 'DifferentialExpression',
        experimentId: '1234',
      },
      store.getState,
      {
        extras: {
          pagination: {
            limit: 50, offset: 0, orderBy: 'p_val_adj', orderDirection: 'ASC', responseKey: 0,
          },
        },
        timeout: 60,
      });

    const loadedAction = store.getActions()[1];
    expect(loadedAction.type).toEqual(DIFF_EXPR_LOADED);
    expect(loadedAction).toMatchSnapshot();
  });
});
