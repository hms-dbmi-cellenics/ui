import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import loadDifferentialExpression from '../../../../redux/actions/differentialExpression/loadDifferentialExpression';

import initialState from '../../../../redux/reducers/differentialExpression/initialState';
import { fetchCachedWork } from '../../../../utils/cacheRequest';

import {
  DIFF_EXPR_LOADING, DIFF_EXPR_LOADED, DIFF_EXPR_ERROR,
} from '../../../../redux/actionTypes/differentialExpression';

jest.mock('localforage');
jest.mock('../../../../utils/cacheRequest');

const mockStore = configureStore([thunk]);

const defaultTableState = {
  geneNamesFilter: null,
  pagination: {
    current: 1, pageSize: 50, showSizeChanger: true, total: 0,
  },
  sorter: { field: 'p_val_adj', columnKey: 'p_val_adj', order: 'ascend' },
};

const backendStatus = {
  status: {
    pipeline: {
      startDate: '2021-01-01T00:00:00',
    },
  },
};

describe('loadDifferentialExpression action', () => {
  const experimentId = '1234';
  const cellSets = {
    cellSet: 'louvain/louvain-0',
    compareWith: 'louvain/louvain-1',
    basis: 'condition/condition-control',
  };
  const comparisonType = 'within';

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Dispatches appropriately on failure', async () => {
    const store = mockStore({
      differentialExpression: {
        ...initialState,
      },
      experimentSettings: {
        backendStatus,
      },
    });
    fetchCachedWork.mockImplementationOnce(() => new Promise((resolve, reject) => reject(new Error('random error!'))));

    await store.dispatch(
      loadDifferentialExpression(experimentId, cellSets, comparisonType, defaultTableState),
    );

    const loadingAction = store.getActions()[0];
    expect(loadingAction.type).toEqual(DIFF_EXPR_LOADING);

    expect(fetchCachedWork).toHaveBeenCalledTimes(1);
    expect(fetchCachedWork).toHaveBeenCalledWith('1234',
      {
        cellSet: 'louvain-0',
        compareWith: 'louvain-1',
        basis: 'condition-control',
        name: 'DifferentialExpression',
        experimentId: '1234',
      },
      backendStatus.status,
      {
        extras: {
          pagination: {
            limit: 50, offset: 0, orderBy: 'p_val_adj', orderDirection: 'ASC', responseKey: 0,
          },
        },
        timeout: 30,
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
      experimentSettings: {
        backendStatus,
      },
    });

    fetchCachedWork.mockImplementationOnce(() => {
      const resolveWith = {
        rows: [
          {
            p_val: 1.16, p_val_adj: 2.16, avg_log2FC: 3.45, gene_names: 'A',
          },
          {
            p_val: 2.16, p_val_adj: 3.16, avg_log2FC: 4.45, gene_names: 'B',
          },
          {
            p_val: 3.16, p_val_adj: 4.16, avg_log2FC: 5.45, gene_names: 'C',
          },
          {
            p_val: 4.16, p_val_adj: 5.16, avg_log2FC: 6.45, gene_names: 'D',
          },
          {
            p_val: 5.16, p_val_adj: 6.16, avg_log2FC: 7.45, gene_names: 'E',
          },
          {
            p_val: 6.16, p_val_adj: 7.16, avg_log2FC: 8.45, gene_names: 'F',
          },
        ],
      };

      return new Promise((resolve) => resolve(resolveWith));
    });

    await store.dispatch(
      loadDifferentialExpression(experimentId, cellSets, comparisonType, defaultTableState),
    );

    const loadingAction = store.getActions()[0];
    expect(loadingAction.type).toEqual(DIFF_EXPR_LOADING);
    expect(loadingAction).toMatchSnapshot();

    expect(fetchCachedWork).toHaveBeenCalledTimes(1);
    expect(fetchCachedWork).toHaveBeenCalledWith('1234',
      {
        cellSet: 'louvain-0',
        compareWith: 'louvain-1',
        basis: 'condition-control',
        name: 'DifferentialExpression',
        experimentId: '1234',
      },
      backendStatus.status,
      {
        extras: {
          pagination: {
            limit: 50, offset: 0, orderBy: 'p_val_adj', orderDirection: 'ASC', responseKey: 0,
          },
        },
        timeout: 30,
      });

    const loadedAction = store.getActions()[1];
    expect(loadedAction.type).toEqual(DIFF_EXPR_LOADED);
    expect(loadedAction).toMatchSnapshot();
  });
});
