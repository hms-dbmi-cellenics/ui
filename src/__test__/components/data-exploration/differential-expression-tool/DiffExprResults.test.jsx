import React from 'react';
import { mount, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import preloadAll from 'jest-next-dynamic';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import waitForActions from 'redux-mock-store-await-actions';

import DiffExprResults from '../../../../components/data-exploration/differential-expression-tool/DiffExprResults';
import sendWork from '../../../../utils/sendWork';
import { DIFF_EXPR_LOADING, DIFF_EXPR_LOADED } from '../../../../redux/actionTypes/differentialExpression';

jest.mock('localforage');
jest.mock('../../../../utils/sendWork', () => ({
  __esModule: true, // this property makes it work
  default: jest.fn(() => new Promise((resolve) => resolve({
    results: [
      {
        body: JSON.stringify({
          rows: [
            {
              p_val: 1.4969461240347763e-12, p_val_adj: 1.647289002209057e-11, avg_log2FC: -1.4274754343649423, gene_names: 'A',
            },
            {
              p_val: 2.4969461240347763e-12, p_val_adj: 2.647289002209057e-11, avg_log2FC: -2.4274754343649423, gene_names: 'B',
            },
            {
              p_val: 3.4969461240347763e-12, p_val_adj: 3.647289002209057e-11, avg_log2FC: -3.4274754343649423, gene_names: 'C',
            },
            {
              p_val: 4.4969461240347763e-12, p_val_adj: 4.647289002209057e-11, avg_log2FC: -4.4274754343649423, gene_names: 'D',
            },
            {
              p_val: 5.4969461240347763e-12, p_val_adj: 5.647289002209057e-11, avg_log2FC: -5.4274754343649423, gene_names: 'E',
            },
          ],
          total: 500,
        }),
      },
    ],
  }))),
}));

const mockStore = configureMockStore([thunk]);

const store = mockStore({
  genes: {
    selected: [],
  },
  cellInfo: {
    focus: {
      store: 'genes',
      key: 'C',
    },
  },
  differentialExpression: {
    properties: {
      data: [
        {
          p_val: 1.4969461240347763e-12, p_val_adj: 1.647289002209057e-11, avg_log2FC: -1.4274754343649423, gene_names: 'A',
        },
        {
          p_val: 2.4969461240347763e-12, p_val_adj: 2.647289002209057e-11, avg_log2FC: -2.4274754343649423, gene_names: 'B',
        },
        {
          p_val: 3.4969461240347763e-12, p_val_adj: 3.647289002209057e-11, avg_log2FC: -3.4274754343649423, gene_names: 'C',
        },
        {
          p_val: 4.4969461240347763e-12, p_val_adj: 4.647289002209057e-11, avg_log2FC: -4.4274754343649423, gene_names: 'D',
        },
        {
          p_val: 5.4969461240347763e-12, p_val_adj: 5.647289002209057e-11, avg_log2FC: -5.4274754343649423, gene_names: 'E',
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
          cellSet: 'louvain/louvain-0',
          compareWith: 'louvain/louvain-1',
          basis: 'condition/condition-control',
        },
      },
    },
  },
});

describe('DiffExprResults', () => {
  beforeAll(async () => {
    await preloadAll();
  });

  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(), // deprecated
        removeListener: jest.fn(), // deprecated
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  configure({ adapter: new Adapter() });
  it('renders correctly', () => {
    const component = mount(
      <Provider store={store}>
        <DiffExprResults experimentId='1234' onGoBack={jest.fn()} width={100} height={200} />
      </Provider>,
    );

    const table = component.find('Table Table');
    const spin = component.find('Table Spin');
    expect(spin.length).toEqual(1);
    expect(table.length).toEqual(1);
    expect(table.getElement().props.columns.length).toEqual(6);
    expect(table.getElement().props.columns[0].key).toEqual('lookup');
    expect(table.getElement().props.columns[1].key).toEqual('gene_names');
    expect(table.getElement().props.columns[2].key).toEqual('avg_log2FC');
    expect(table.getElement().props.columns[3].key).toEqual('p_val_adj');
    expect(table.getElement().props.columns[4].key).toEqual('pct_1');
    expect(table.getElement().props.columns[5].key).toEqual('pct_2');

    expect(table.getElement().props.dataSource.length).toEqual(5);
    expect(table.getElement().props.data.length).toEqual(5);
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
      <Provider store={store}>
        <DiffExprResults experimentId='1234' onGoBack={jest.fn()} width={100} height={200} />
      </Provider>,
    );

    const table = component.find('Table Table');

    act(() => {
      table.getElement().props.onChange(newPagination, {}, newSorter);
    });

    // // Wait for side-effect to propagate (properties loading and loaded).
    await waitForActions(store, [DIFF_EXPR_LOADING, DIFF_EXPR_LOADED]);

    expect(sendWork).toHaveBeenCalledWith('1234', 60,
      {
        cellSet: 'louvain-0',
        compareWith: 'louvain-1',
        basis: 'condition-control',
        experimentId: '1234',
        name: 'DifferentialExpression',
      },
      {
        pagination: {
          limit: 4, offset: 0, orderBy: 'gene_names', orderDirection: 'ASC', responseKey: 0,
        },
      });

    expect(store.getActions()[0]).toMatchSnapshot();
    expect(store.getActions()[1]).toMatchSnapshot();
  });

  it('Having a focused gene triggers focused view for `eye` button.', () => {
    // Redefine store from `beforeEach`.
    const component = mount(
      <Provider store={store}>
        <DiffExprResults experimentId='1234' onGoBack={jest.fn()} width={100} height={200} />
      </Provider>,
    );

    const table = component.find('Space Table Table');

    table.getElement().props.data.forEach((row) => {
      const lookupComponent = mount(
        <Provider store={store}>
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
      <Provider store={store}>
        <DiffExprResults experimentId='1234' onGoBack={jest.fn()} width={100} height={200} />
      </Provider>,
    );
    const button = component.find('#settingsButton').first();
    expect(button.text()).toContain('Show');
    button.simulate('click');
    expect(button.text()).toContain('Hide');

    const div = component.find('#settingsText');
    expect(div.text()).toEqual('Louvain 0 vs. Louvain 1 in Condition control');
    button.simulate('click');
    expect(button.childAt(0).text()).toEqual('Show settings');
    expect(!div);
  });
});
