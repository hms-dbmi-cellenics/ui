import React from 'react';
import { mount } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import waitForActions from 'redux-mock-store-await-actions';

import DiffExprManager from 'components/data-exploration/differential-expression-tool/DiffExprManager';
import DiffExprCompute from 'components/data-exploration/differential-expression-tool/DiffExprCompute';
import DiffExprResults from 'components/data-exploration/differential-expression-tool/DiffExprResults';

import { mockCellSets } from '__test__/test-utils/cellSets.mock';

import { DIFF_EXPR_LOADING, DIFF_EXPR_LOADED, DIFF_EXPR_ORDERING_SET } from 'redux/actionTypes/differentialExpression';

jest.mock('utils/work/fetchWork', () => (
  jest.fn(() => new Promise((resolve) => resolve({
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
  })))
));

const mockStore = configureMockStore([thunk]);

const experimentId = '1234';

const backendStatus = {
  [experimentId]: {
    status: {
      pipeline: {
        startDate: '2021-01-01T00:00:00',
      },
    },
  },
};

const storeState = {
  genes: {
    selected: [],
  },
  cellInfo: {
    focus: {
      store: 'genes',
      key: 'C',
    },
  },
  cellSets: mockCellSets,
  differentialExpression: {
    properties: {
      data: [
        {
          p_val: 1.496, p_val_adj: 1.647, logFC: -1.427, gene_names: 'A', auc: '0.1', pct_1: '100', pct_2: '100',
        },
        {
          p_val: 2.496, p_val_adj: 2.647, logFC: -2.427, gene_names: 'B', auc: '0.2', pct_1: '90', pct_2: '90',
        },
        {
          p_val: 3.496, p_val_adj: 3.647, logFC: -3.427, gene_names: 'C', auc: '0.3', pct_1: '80', pct_2: '80',
        },
        {
          p_val: 4.496, p_val_adj: 4.647, logFC: -4.427, gene_names: 'D', auc: '0.4', pct_1: '70', pct_2: '70',
        },
        {
          p_val: 5.496, p_val_adj: 5.647, logFC: -5.427, gene_names: 'E', auc: '0.5', pct_1: '60', pct_2: '60',
        },
      ],
      loading: false,
      error: false,
      total: 5,
    },
    comparison: {
      type: 'between',
      group: {
        between: {
          cellSet: 'louvain/cluster-a',
          compareWith: 'louvain/cluster-b',
          basis: 'scratchpad/scratchpad-a',
        },
      },
      advancedFilters: [],
    },
  },
  backendStatus,
};

let store = null;

describe('DiffExprManager regression test - diff exp would not reload after `go back` was hit and a new cluster selected', () => {
  beforeEach(() => {
    store = mockStore(storeState);
  });

  it('on click of compute with changed parameters, DiffExprManager calls the results view and dispatches the appropriate actions', async () => {
    const component = mount(
      <Provider store={store}>
        <DiffExprManager experimentId={experimentId} view='compute' width={100} height={200} />
      </Provider>,
    );

    const comparisonGroup = { cellSet: 'louvain/cluster-1', compareWith: 'rest', basis: 'all' };
    act(() => {
      component.find(DiffExprCompute).props().onCompute('between', comparisonGroup);
    });
    component.update();

    expect(component.find(DiffExprResults).length).toEqual(1);
    expect(component.find(DiffExprCompute).length).toEqual(0);

    await waitForActions(store, [DIFF_EXPR_ORDERING_SET, DIFF_EXPR_LOADING, DIFF_EXPR_LOADED]);

    expect(store.getActions().length).toEqual(3);
    expect(store.getActions()[1]).toMatchSnapshot();
    expect(store.getActions()[2]).toMatchSnapshot();
  });

  it('if we then go back and change the parameters again, the new differential expression data should be loading', async () => {
    const component = mount(
      <Provider store={store}>
        <DiffExprManager experimentId={experimentId} view='compute' width={100} height={200} />
      </Provider>,
    );

    // Choose a cluster and hit compute.
    let comparisonGroup = { cellSet: 'louvain/cluster-2', compareWith: 'rest', basis: 'all' };
    act(() => {
      component.find(DiffExprCompute).props().onCompute('between', comparisonGroup);
    });
    component.update();

    expect(component.find(DiffExprResults).length).toEqual(1);
    expect(component.find(DiffExprCompute).length).toEqual(0);

    // Ensure load diff exp was called.
    await waitForActions(store, [DIFF_EXPR_ORDERING_SET, DIFF_EXPR_LOADING, DIFF_EXPR_LOADED]);

    expect(store.getActions().length).toEqual(3);
    expect(store.getActions()[1]).toMatchSnapshot();
    expect(store.getActions()[2]).toMatchSnapshot();

    // Go back.
    act(() => {
      component.find(DiffExprResults).props().onGoBack();
    });
    component.update();

    // Ensure original is still rendered correctly.
    expect(component.find(DiffExprResults).length).toEqual(0);
    expect(component.find(DiffExprCompute).length).toEqual(1);

    // Choose another cell set.
    comparisonGroup = { cellSet: 'louvain/cluster-3', compareWith: 'rest', basis: 'all' };
    act(() => {
      component.find(DiffExprCompute).props().onCompute('between', comparisonGroup);
    });
    component.update();

    // Ensure load diff exp was called again.
    await waitForActions(store, [DIFF_EXPR_ORDERING_SET, DIFF_EXPR_LOADING, DIFF_EXPR_LOADED]);

    expect(store.getActions().length).toEqual(6);
    expect(store.getActions()[2]).toMatchSnapshot();
    expect(store.getActions()[3]).toMatchSnapshot();
  });
});
