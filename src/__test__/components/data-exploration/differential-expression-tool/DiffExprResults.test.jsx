import React from 'react';
import { mount, shallow } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { Empty } from 'antd';
import _ from 'lodash';
import waitForActions from 'redux-mock-store-await-actions';
import AdvancedFilteringModal from 'components/data-exploration/differential-expression-tool/AdvancedFilteringModal';

import DiffExprResults from 'components/data-exploration/differential-expression-tool/DiffExprResults';
import { DIFF_EXPR_LOADING, DIFF_EXPR_LOADED, DIFF_EXPR_ORDERING_SET } from 'redux/actionTypes/differentialExpression';

import { mockCellSets } from '__test__/test-utils/cellSets.mock';

import Loader from 'components/Loader';
import fetchWork from 'utils/work/fetchWork';

jest.mock('utils/getTimeoutForWorkerTask', () => ({
  __esModule: true, // this property makes it work
  default: () => 60,
}));

jest.mock('utils/work/fetchWork',
  () => (jest.fn(() => new Promise((resolve) => resolve({
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
  })))));

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

const mockGeneExpressionData = [
  {
    p_val: 1.496, p_val_adj: 1.647, logFC: -1.427, gene_names: 'A', auc: '0.1', pct_1: '100', pct_2: '100', Gene: 'EN123123123123123',
  },
  {
    p_val: 2.496, p_val_adj: 2.647, logFC: -2.427, gene_names: 'B', auc: '0.2', pct_1: '90', pct_2: '90', Gene: 'EN123123123123123',
  },
  {
    p_val: 3.496, p_val_adj: 3.647, logFC: -3.427, gene_names: 'C', auc: '0.3', pct_1: '80', pct_2: '80', Gene: 'EN123123123123123',
  },
  {
    p_val: 4.496, p_val_adj: 4.647, logFC: -4.427, gene_names: 'D', auc: '0.4', pct_1: '70', pct_2: '70', Gene: 'EN123123123123123',
  },
  {
    p_val: 5.496, p_val_adj: 5.647, logFC: -5.427, gene_names: 'E', auc: '0.5', pct_1: '60', pct_2: '60', Gene: 'EN123123123123123',
  },
];

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
  cellSets: mockCellSets,
  differentialExpression: {
    properties: {
      data: mockGeneExpressionData,
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

// State with less gene expression fields
const partialState = _.cloneDeep(resultState);
const partialGeneExpData = mockGeneExpressionData.map((data) => {
  // eslint-disable-next-line camelcase
  const { pct_1, pct_2, ...remaining } = data;
  return remaining;
});
partialState.differentialExpression.properties.data = partialGeneExpData;

// State with more gene expression fields
const extraState = _.cloneDeep(resultState);
const extraGeneExpData = mockGeneExpressionData.map((data, idx) => {
  const newData = {
    ...data,
    extra_field: idx,
    more_extra_field: idx + 1,
  };

  return newData;
});
extraState.differentialExpression.properties.data = extraGeneExpData;

// State with no results
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
const partialResultStore = mockStore(partialState);
const extraResultStore = mockStore(extraState);
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

  it('fetches all the genes', async () => {
    const newPagination = {
      current: 1,
      pageSize: 4,
      showSizeChanger: true,
      total: mockGeneExpressionData.length,
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

    // Wait for side-effect to propagate (properties loading and loaded).
    await waitForActions(
      withResultStore,
      [DIFF_EXPR_ORDERING_SET, DIFF_EXPR_LOADING, DIFF_EXPR_LOADED],
    );

    const entries = component.find('.ant-table-tbody').children();

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
      expect.any(Function),
      {
        extras: {
          pagination: {
            limit: 1000000, offset: 0, orderBy: 'logFC', orderDirection: 'DESC', responseKey: 0,
          },
        },
        timeout: 60,
      },
    );
    expect(entries).toHaveLength(6);
    expect(withResultStore.getActions()[1]).toMatchSnapshot();
    expect(withResultStore.getActions()[2]).toMatchSnapshot();
  });

  it('displays the correct genes when searching', () => {
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

    const searchBox = component.find('.ant-input');

    searchBox.simulate('change', { target: { value: 'A' } });

    const entries = component.find('.ant-table-tbody').children();

    expect(entries.at(1).text()).toEqual('A-1.4271.6471001000.1');
    expect(entries).toHaveLength(2);
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
    expect(div.text()).toEqual('cluster a vs. cluster b in New Cluster');
    button.simulate('click');
    expect(button.childAt(0).text()).toEqual('Show settings');
    expect(!div);
  });

  it('Does not show loading indicator if there is no data returned', () => {
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

  it('Columns without corresponding data are not shown', async () => {
    const component = mount(
      <Provider store={partialResultStore}>
        <DiffExprResults
          experimentId={experimentId}
          onGoBack={jest.fn()}
          width={100}
          height={200}
        />
      </Provider>,
    );

    const table = component.find('Table');
    expect(table.getElement().props.columns.length).toEqual(5);
    expect(table.getElement().props.columns[0].key).toEqual('lookup');
    expect(table.getElement().props.columns[1].key).toEqual('gene_names');
    expect(table.getElement().props.columns[2].key).toEqual('logFC');
    expect(table.getElement().props.columns[3].key).toEqual('p_val_adj');
    expect(table.getElement().props.columns[4].key).toEqual('auc');
  });

  it('Data without corresponding columns are not shown', async () => {
    const component = mount(
      <Provider store={extraResultStore}>
        <DiffExprResults
          experimentId={experimentId}
          onGoBack={jest.fn()}
          width={100}
          height={200}
        />
      </Provider>,
    );

    const table = component.find('Table');

    expect(table.getElement().props.columns.length).toEqual(7);
    expect(table.getElement().props.columns[0].key).toEqual('lookup');
    expect(table.getElement().props.columns[1].key).toEqual('gene_names');
    expect(table.getElement().props.columns[2].key).toEqual('logFC');
    expect(table.getElement().props.columns[3].key).toEqual('p_val_adj');
    expect(table.getElement().props.columns[4].key).toEqual('pct_1');
    expect(table.getElement().props.columns[5].key).toEqual('pct_2');
    expect(table.getElement().props.columns[6].key).toEqual('auc');
  });

  it('The export as CSV alert opens and closes properly', async () => {
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

    // Clicking the CSV button opens the modal
    const csvButton = component.find('span[children="Export as CSV"]');
    expect(csvButton.length).toEqual(1);

    act(() => {
      csvButton.simulate('click');
    });
    component.update();

    const csvModal = component.find('Alert');
    expect(csvModal.length).toEqual(1);

    // Clicking the close button closes the CSV modal
    const closeCsvModalButton = csvModal.find('button');
    expect(closeCsvModalButton.length).toEqual(1);

    act(() => {
      closeCsvModalButton.simulate('click');
    });
    component.update();

    // Expect CSV modal to not be shown anymore
    expect(component.find('Alert').length).toEqual(0);
  });
});
