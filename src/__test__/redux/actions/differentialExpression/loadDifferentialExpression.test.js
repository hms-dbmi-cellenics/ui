import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchWork from 'utils/work/fetchWork';
import loadDifferentialExpression from 'redux/actions/differentialExpression/loadDifferentialExpression';

import initialState from 'redux/reducers/differentialExpression/initialState';

import {
  DIFF_EXPR_LOADING, DIFF_EXPR_LOADED, DIFF_EXPR_ERROR,
} from 'redux/actionTypes/differentialExpression';

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
      expect.any(Function),
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

  it('Dispatches appropriately on success for comparison within a sample', async () => {
    const store = mockStore({
      differentialExpression: {
        ...initialState,
      },
      backendStatus,
    });

    fetchWork.mockImplementationOnce(() => {
      const resolveWith = {
        data: {
          p_val: [1.496, 2.496, 3.496, 4.496, 5.496],
          p_val_adj: [1.647, 2.647, 3.647, 4.647, 5.647],
          logFC: [-1.427, -2.427, -3.427, -4.427, -5.427],
          gene_names: ['A', 'B', 'C', 'D', 'E'],
          Gene: ['EASAD0', 'ENASD23', 'EN34S', 'ENSD33', 'ENASD233'],
          auc: ['0.1', '0.2', '0.3', '0.4', '0.5'],
          pct_1: ['100', '90', '80', '70', '60'],
          pct_2: ['100', '90', '80', '70', '60'],
        },
        total: 500,
      };

      return new Promise((resolve) => resolve(resolveWith));
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
      expect.any(Function),
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
  it('Dispatches appropriately on success for comparison between samples', async () => {
    const store = mockStore({
      differentialExpression: {
        ...initialState,
      },
      backendStatus,
    });

    fetchWork.mockImplementationOnce(() => {
      const resolveWith = {
        data: {
          AveExpr: [3.054, 2.356, 2.19, 2.189, 1.788],
          logFC: [-1.427, -2.427, -3.427, -4.427, -5.427],
          gene_names: ['A', 'B', 'C', 'D', 'E'],
          Gene: ['EASAD0', 'ENASD23', 'EN34S', 'ENSD33', 'ENASD233'],
        },
        total: 500,
      };

      return new Promise((resolve) => resolve(resolveWith));
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
      expect.any(Function),
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

  it('Doesnt crash if total is 0', async () => {
    const store = mockStore({
      differentialExpression: {
        ...initialState,
      },
      backendStatus,
    });
    fetchWork.mockImplementationOnce(() => {
      const resolveWith = {
        data: {
          p_val: [],
          p_val_adj: [],
          logFC: [],
          gene_names: [],
          Gene: [],
          auc: [],
          pct_1: [],
          pct_2: [],
        },
        total: 0,
      };

      return new Promise((resolve) => resolve(resolveWith));
    });
    await store.dispatch(
      loadDifferentialExpression(experimentId, cellSets, comparisonType, defaultTableState),
    );
    const loadedActions = store.getActions();
    expect(loadedActions).toMatchSnapshot();
  });
});
