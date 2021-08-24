import React from 'react';
import { mount, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import preloadAll from 'jest-next-dynamic';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import waitForActions from 'redux-mock-store-await-actions';
import DiffExprManager from '../../../../components/data-exploration/differential-expression-tool/DiffExprManager';
import DiffExprCompute from '../../../../components/data-exploration/differential-expression-tool/DiffExprCompute';
import DiffExprResults from '../../../../components/data-exploration/differential-expression-tool/DiffExprResults';
import initialState from '../../../../redux/reducers/differentialExpression/initialState';

import { DIFF_EXPR_LOADING, DIFF_EXPR_LOADED } from '../../../../redux/actionTypes/differentialExpression';

jest.mock('localforage');

// ensure isBrowser is `true`
jest.mock('../../../../utils/environment', () => ({
  __esModule: true,
  isBrowser: () => true,
}));

jest.mock('../../../../utils/work/fetchWork', () => ({
  __esModule: true, // this property makes it work
  fetchWork: jest.fn(() => new Promise((resolve) => resolve({
    rows: [
      {
        p_val: 1.4969461240347763e-12, p_val_adj: 1.647289002209057e-11, logFC: -1.4274754343649423, gene_names: 'A',
      },
      {
        p_val: 2.4969461240347763e-12, p_val_adj: 2.647289002209057e-11, logFC: -2.4274754343649423, gene_names: 'B',
      },
      {
        p_val: 3.4969461240347763e-12, p_val_adj: 3.647289002209057e-11, logFC: -3.4274754343649423, gene_names: 'C',
      },
      {
        p_val: 4.4969461240347763e-12, p_val_adj: 4.647289002209057e-11, logFC: -4.4274754343649423, gene_names: 'D',
      },
      {
        p_val: 5.4969461240347763e-12, p_val_adj: 5.647289002209057e-11, logFC: -5.4274754343649423, gene_names: 'E',
      },
    ],
    total: 500,
  }))),
}));

const mockStore = configureMockStore([thunk]);

const experimentId = '1234';

const storeState = {
  cellSets: {
    hierarchy: [],
    properties: {},
  },
  genes: {
    focused: undefined,
  },
  differentialExpression: {
    ...initialState,
    comparison: {
      ...initialState.comparison,
      type: 'between',
      group: {
        ...initialState.comparison.group,
        between: {
          ...initialState.comparison.group.between,
          cellSet: 'condition/condition-treated',
          compareWith: 'condition/condition-control',
          basis: 'louvain/cluster-a;',
        },
      },
    },
  },
  backendStatus: {
    [experimentId]: {
      status: {
        pipeline: {
          startDate: '2021-01-01T00:00:00',
        },
      },
    },
  },
};

let store = null;

describe('DiffExprManager regression test -- diff exp would not reload after `go back` was hit and a new cluster selected', () => {
  beforeAll(async () => {
    await preloadAll();
  });

  beforeEach(() => {
    store = mockStore(storeState);
  });

  configure({ adapter: new Adapter() });

  it('on click of compute with changed parameters, DiffExprManager calls the results view and dispatches the appropriate actions', async () => {
    const component = mount(
      <Provider store={store}>
        <DiffExprManager experimentId={experimentId} view='compute' width={100} height={200} />
      </Provider>,
    );

    const cellSets = { cellSet: 'louvain/cluster-1', compareWith: 'rest', basis: 'all' };
    act(() => {
      component.find(DiffExprCompute).props().onCompute('between', cellSets);
    });
    component.update();

    expect(component.find(DiffExprResults).length).toEqual(1);
    expect(component.find(DiffExprCompute).length).toEqual(0);

    await waitForActions(store, [DIFF_EXPR_LOADING, DIFF_EXPR_LOADED]);

    expect(store.getActions().length).toEqual(2);
    expect(store.getActions()[0]).toMatchSnapshot();
    expect(store.getActions()[1]).toMatchSnapshot();
  });

  it('if we then go back and change the parameters again, the new differential expression data should be loading', async () => {
    const component = mount(
      <Provider store={store}>
        <DiffExprManager experimentId={experimentId} view='compute' width={100} height={200} />
      </Provider>,
    );

    // Choose a cluster and hit compute.
    let cellSets = { cellSet: 'louvain/cluster-2', compareWith: 'rest', basis: 'all' };
    act(() => {
      component.find(DiffExprCompute).props().onCompute('between', cellSets);
    });
    component.update();

    expect(component.find(DiffExprResults).length).toEqual(1);
    expect(component.find(DiffExprCompute).length).toEqual(0);

    // Ensure load diff exp was called.
    await waitForActions(store, [DIFF_EXPR_LOADING, DIFF_EXPR_LOADED]);

    expect(store.getActions().length).toEqual(2);
    expect(store.getActions()[0]).toMatchSnapshot();
    expect(store.getActions()[1]).toMatchSnapshot();

    // Go back.
    act(() => {
      component.find(DiffExprResults).props().onGoBack();
    });
    component.update();

    // Ensure original is still rendered correctly.
    expect(component.find(DiffExprResults).length).toEqual(0);
    expect(component.find(DiffExprCompute).length).toEqual(1);

    // Choose another cell set.
    cellSets = { cellSet: 'louvain/cluster-3', compareWith: 'rest', basis: 'all' };
    act(() => {
      component.find(DiffExprCompute).props().onCompute('between', cellSets);
    });
    component.update();

    // Ensure load diff exp was called again.
    await waitForActions(store, [DIFF_EXPR_LOADING, DIFF_EXPR_LOADED]);

    expect(store.getActions().length).toEqual(4);
    expect(store.getActions()[2]).toMatchSnapshot();
    expect(store.getActions()[3]).toMatchSnapshot();
  });
});
