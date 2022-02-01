import React from 'react';
import { mount, shallow } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { Empty } from 'antd';
import waitForActions from 'redux-mock-store-await-actions';
import AdvancedFilteringModal from 'components/data-exploration/differential-expression-tool/AdvancedFilteringModal';

import DiffExprResults from 'components/data-exploration/differential-expression-tool/DiffExprResults';
import { fetchWork } from 'utils/work/fetchWork';
import { DIFF_EXPR_LOADING, DIFF_EXPR_LOADED, DIFF_EXPR_ORDERING_SET } from 'redux/actionTypes/differentialExpression';
import '__test__/test-utils/setupTests';

import Loader from 'components/Loader';

jest.mock('utils/getTimeoutForWorkerTask', () => ({
  __esModule: true, // this property makes it work
  default: () => 60,
}));

jest.mock('utils/work/fetchWork', () => ({
  __esModule: true, // this property makes it work
  fetchWork: jest.fn(() => new Promise((resolve) => resolve({
    rows: [
      {
        p_val: 1.4969461240347763e-12, p_val_adj: 1.647289002209057e-11, logFC: -1.4274754343649423, gene_names: 'A', auc: '0.1',
      },
      {
        p_val: 2.4969461240347763e-12, p_val_adj: 2.647289002209057e-11, logFC: -2.4274754343649423, gene_names: 'B', auc: '0.2',
      },
      {
        p_val: 3.4969461240347763e-12, p_val_adj: 3.647289002209057e-11, logFC: -3.4274754343649423, gene_names: 'C', auc: '0.3',
      },
      {
        p_val: 4.4969461240347763e-12, p_val_adj: 4.647289002209057e-11, logFC: -4.4274754343649423, gene_names: 'D', auc: '0.4',
      },
      {
        p_val: 5.4969461240347763e-12, p_val_adj: 5.647289002209057e-11, logFC: -5.4274754343649423, gene_names: 'E', auc: '0.5',
      },
    ],
    total: 500,
  }))),
}));

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

const resultState = {
  genes: {
    selected: [],
  },
  cellInfo: {
    focus: {
      store: 'genes',
      key: 'C',
    },
  },
  cellSets: {
    loading: false,
    error: false,
    selected: [],
    properties: {
      'cluster-a': {
        name: 'Name of Cluster A',
        key: 'cluster-a',
        cellIds: new Set([1, 2]),
        color: '#00FF00',
      },
      'cluster-b': {
        name: 'Name of Cluster B',
        key: 'cluster-b',
        cellIds: new Set([2, 3, 4, 5]),
        color: '#FF0000',
      },
      'scratchpad-a': {
        cellIds: new Set([3]),
        key: 'scratchpad-a',
        name: 'Name of Scratchpad A',
        color: '#ff00ff',
      },
      louvain: {
        cellIds: new Set(),
        name: 'Louvain clusters',
        key: 'louvain',
        type: 'cellSets',
        rootNode: true,
      },
      scratchpad: {
        cellIds: new Set(),
        name: 'Custom selections',
        key: 'scratchpad',
        type: 'cellSets',
        rootNode: true,
      },
    },
    hierarchy: [
      {
        key: 'louvain',
        children: [{ key: 'cluster-a' }, { key: 'cluster-b' }],
      },
      {
        key: 'scratchpad',
        children: [{ key: 'scratchpad-a' }],
      },
    ],
  },
  differentialExpression: {
    properties: {
      data: [
        {
          p_val: 1.4969461240347763e-12, p_val_adj: 1.647289002209057e-11, logFC: -1.4274754343649423, gene_names: 'A', auc: '0.1',
        },
        {
          p_val: 2.4969461240347763e-12, p_val_adj: 2.647289002209057e-11, logFC: -2.4274754343649423, gene_names: 'B', auc: '0.2',
        },
        {
          p_val: 3.4969461240347763e-12, p_val_adj: 3.647289002209057e-11, logFC: -3.4274754343649423, gene_names: 'C', auc: '0.3',
        },
        {
          p_val: 4.4969461240347763e-12, p_val_adj: 4.647289002209057e-11, logFC: -4.4274754343649423, gene_names: 'D', auc: '0.4',
        },
        {
          p_val: 5.4969461240347763e-12, p_val_adj: 5.647289002209057e-11, logFC: -5.4274754343649423, gene_names: 'E', auc: '0.5',
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

const noResultState = {
  ...resultState,
  differentialExpression: {
    ...resultState.differentialExpression,
    properties: {
      ...resultState.differentialExpression.properties,
      data: [],
      loading: false,
      error: false,
      total: 0,
    },
  },
};

const withResultStore = mockStore(resultState);
const noResultStore = mockStore(noResultState);

describe('DiffExprResults', () => {
  it('renders correctly', () => {
    const component = mount(
      <Provider store={withResultStore}>
        <DiffExprResults
          experimentId={experimentId}
          onGoBack={jest.fn()}
          width={100}
          height={200}
        />
      </Provider>,
    );

    const table = component.find('Table');
    const spin = component.find(Loader);
    expect(spin.length).toEqual(0);
    expect(table.length).toEqual(1);
    expect(table.getElement().props.columns.length).toEqual(7);
    expect(table.getElement().props.columns[0].key).toEqual('lookup');
    expect(table.getElement().props.columns[1].key).toEqual('gene_names');
    expect(table.getElement().props.columns[2].key).toEqual('logFC');
    expect(table.getElement().props.columns[3].key).toEqual('p_val_adj');
    expect(table.getElement().props.columns[4].key).toEqual('pct_1');
    expect(table.getElement().props.columns[5].key).toEqual('pct_2');
    expect(table.getElement().props.columns[6].key).toEqual('auc');

    expect(table.getElement().props.dataSource.length).toEqual(5);
    expect(table.getElement().props.data.length).toEqual(5);
  });

  it('is sorted by descending logFC by default', () => {
    const component = mount(
      <Provider store={withResultStore}>
        <DiffExprResults
          experimentId={experimentId}
          onGoBack={jest.fn()}
          width={100}
          height={200}
        />
      </Provider>,
    );

    const table = component.find('Table');
    expect(table.getElement().props.columns[1].sortOrder).toEqual(null);
    expect(table.getElement().props.columns[2].sortOrder).toEqual('descend');
    expect(table.getElement().props.columns[3].sortOrder).toEqual(null);
    expect(table.getElement().props.columns[4].sortOrder).toEqual(null);
    expect(table.getElement().props.columns[5].sortOrder).toEqual(null);
    expect(table.getElement().props.columns[6].sortOrder).toEqual(null);
  });

  it('can sort the gene names in alphabetical order', async () => {
    const newPagination = {
      current: 1,
      pageSize: 4,
      showSizeChanger: true,
      total: 4,
    };

    const newSorter = {
      column: {
        dataIndex: 'gene_names',
        key: 'gene_names',
      },
      render: jest.fn(),
      columnKey: 'gene_names',
      field: 'gene_names',
      order: 'ascend',
    };

    const component = mount(
      <Provider store={withResultStore}>
        <DiffExprResults
          experimentId={experimentId}
          onGoBack={jest.fn()}
          width={100}
          height={200}
        />
      </Provider>,
    );

    const table = component.find('Table');

    act(() => {
      table.getElement().props.onChange(newPagination, {}, newSorter);
    });

    // // Wait for side-effect to propagate (properties loading and loaded).
    await waitForActions(withResultStore, [DIFF_EXPR_ORDERING_SET, DIFF_EXPR_LOADING, DIFF_EXPR_LOADED]);

    expect(fetchWork).toHaveBeenCalledWith(
      '1234',
      {
        cellSet: 'cluster-a',
        compareWith: 'cluster-b',
        basis: 'scratchpad-a',
        comparisonType: 'between',
        experimentId: '1234',
        name: 'DifferentialExpression',
      },
      withResultStore.getState,
      {
        extras: {
          pagination: {
            limit: 4, offset: 0, orderBy: 'gene_names', orderDirection: 'ASC', responseKey: 0,
          },
        },
        timeout: 60,
      },
    );

    expect(withResultStore.getActions()[1]).toMatchSnapshot();
    expect(withResultStore.getActions()[2]).toMatchSnapshot();
  });

  it('Having a focused gene triggers focused view for `eye` button.', () => {
    // Redefine store from `beforeEach`.
    const component = mount(
      <Provider store={withResultStore}>
        <DiffExprResults
          experimentId={experimentId}
          onGoBack={jest.fn()}
          width={100}
          height={200}
        />
      </Provider>,
    );

    const table = component.find('Table');

    table.getElement().props.data.forEach((row) => {
      const lookupComponent = mount(
        <Provider store={withResultStore}>
          {row.lookup}
        </Provider>,
      );

      const focusButtonTooltip = lookupComponent.find('FocusButton Tooltip');

      if (row.gene_names === 'C') {
        expect(focusButtonTooltip.props().title).toContain('Hide');
      } else {
        expect(focusButtonTooltip.props().title).toContain('Show');
      }

      lookupComponent.unmount();
    });
  });

  it('Show comparison settings button works.', () => {
    const component = mount(
      <Provider store={withResultStore}>
        <DiffExprResults
          experimentId={experimentId}
          onGoBack={jest.fn()}
          width={100}
          height={200}
        />
      </Provider>,
    );
    const button = component.find('#settingsButton').first();
    expect(button.text()).toContain('Show');
    button.simulate('click');
    expect(button.text()).toContain('Hide');

    const div = component.find('#settingsText');
    // Should display name of cluster instead of ID
    expect(div.text()).toEqual('Name of Cluster A vs. Name of Cluster B in Name of Scratchpad A');
    button.simulate('click');
    expect(button.childAt(0).text()).toEqual('Show settings');
    expect(!div);
  });

  it("Doesn't show loading indicator if there is no data returned", () => {
    const component = mount(
      <Provider store={noResultStore}>
        <DiffExprResults
          experimentId={experimentId}
        />
      </Provider>,
    );

    const spin = component.find(Loader);
    const empty = component.find(Empty);

    // There should be no loader
    expect(spin.length).toEqual(0);

    // Expect table to contain Empty component
    expect(empty.length).toEqual(1);
  });

  it('Advanced filter button opens and closes the modal', async () => {
    const component = mount(
      <Provider store={withResultStore}>
        <DiffExprResults
          experimentId={experimentId}
          onGoBack={jest.fn()}
          width={100}
          height={200}
        />
      </Provider>,
    );
    const buttons = component.find('Button');
    expect(buttons.at(2).text()).toEqual('Advanced filtering');

    // opening the modal
    buttons.at(2).simulate('click');
    expect(component.find(AdvancedFilteringModal).length).toEqual(1);

    // Adding a filter and applying it
    const dropdown = component.find('Dropdown');
    const menuInstance = shallow(dropdown.props().overlay);
    menuInstance.at(0).simulate('click');
    await waitForActions(withResultStore, [DIFF_EXPR_ORDERING_SET, DIFF_EXPR_LOADING, DIFF_EXPR_LOADED]);

    // closing the modal
    const closeButton = component.find('.ant-modal-close');
    closeButton.simulate('click');
    expect(component.find(AdvancedFilteringModal).length).toEqual(0);
  });

  it('Pathway analysis button opens and closes the modal and dispatches loadDifferentialExpression', async () => {
    const component = mount(
      <Provider store={withResultStore}>
        <DiffExprResults
          experimentId={experimentId}
          onGoBack={jest.fn()}
          width={100}
          height={200}
        />
      </Provider>,
    );

    // On clicking LaunchPathwayAnalysisModal button
    const buttons = component.find('span[children="Pathway analysis"]');
    expect(buttons.at(0).text()).toEqual('Pathway analysis');
    buttons.at(0).simulate('click');

    // Shows the modal
    expect(component.find('LaunchPathwayAnalysisModal').length).toEqual(1);

    // closing the modal
    const closeButton = component.find('.ant-modal-close');
    closeButton.simulate('click');
    expect(component.find('LaunchPathwayAnalysisModal').length).toEqual(0);
  });
});
