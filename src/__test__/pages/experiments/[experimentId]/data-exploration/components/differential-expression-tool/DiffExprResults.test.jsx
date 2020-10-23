import React from 'react';
import { mount, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import preloadAll from 'jest-next-dynamic';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import waitForActions from 'redux-mock-store-await-actions';
import DiffExprResults from '../../../../../../../pages/experiments/[experimentId]/data-exploration/components/differential-expression-tool/DiffExprResults';
import sendWork from '../../../../../../../utils/sendWork';
import { DIFF_EXPR_LOADING, DIFF_EXPR_LOADED } from '../../../../../../../redux/actionTypes/differentialExpression';

jest.mock('localforage');
jest.mock('../../../../../../../utils/sendWork', () => ({
  __esModule: true, // this property makes it work
  default: jest.fn(() => new Promise((resolve) => resolve({
    results: [
      {
        body: JSON.stringify({
          rows: [
            {
              pval: 1.4969461240347763e-12, qval: 1.647289002209057e-11, log2fc: -1.4274754343649423, gene_names: 'A',
            },
            {
              pval: 2.4969461240347763e-12, qval: 2.647289002209057e-11, log2fc: -2.4274754343649423, gene_names: 'B',
            },
            {
              pval: 3.4969461240347763e-12, qval: 3.647289002209057e-11, log2fc: -3.4274754343649423, gene_names: 'C',
            },
            {
              pval: 4.4969461240347763e-12, qval: 4.647289002209057e-11, log2fc: -4.4274754343649423, gene_names: 'D',
            },
            {
              pval: 5.4969461240347763e-12, qval: 5.647289002209057e-11, log2fc: -5.4274754343649423, gene_names: 'E',
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
    focused: undefined,
  },
  differentialExpression: {
    properties: {
      data: [
        {
          pval: 1.4969461240347763e-12, qval: 1.647289002209057e-11, log2fc: -1.4274754343649423, gene_names: 'A',
        },
        {
          pval: 2.4969461240347763e-12, qval: 2.647289002209057e-11, log2fc: -2.4274754343649423, gene_names: 'B',
        },
        {
          pval: 3.4969461240347763e-12, qval: 3.647289002209057e-11, log2fc: -3.4274754343649423, gene_names: 'C',
        },
        {
          pval: 4.4969461240347763e-12, qval: 4.647289002209057e-11, log2fc: -4.4274754343649423, gene_names: 'D',
        },
        {
          pval: 5.4969461240347763e-12, qval: 5.647289002209057e-11, log2fc: -5.4274754343649423, gene_names: 'E',
        },
      ],
      loading: false,
      error: false,
      total: 5,
    },
  },
});

const cellSets = {
  cellSet: 'louvain-0',
  compareWith: 'louvain-1',
};

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
        <DiffExprResults experimentId='1234' onGoBack={jest.fn()} cellSets={cellSets} width={100} height={200} />
      </Provider>,
    );

    const table = component.find('Table Table');
    const spin = component.find('Table Spin');
    expect(spin.length).toEqual(1);
    expect(table.length).toEqual(1);
    expect(table.getElement().props.columns.length).toEqual(5);
    expect(table.getElement().props.columns[0].key).toEqual('lookup');
    expect(table.getElement().props.columns[1].title).toEqual('Gene');
    expect(table.getElement().props.columns[2].key).toEqual('zscore');
    expect(table.getElement().props.columns[3].key).toEqual('abszscore');
    expect(table.getElement().props.columns[4].key).toEqual('log2fc');

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
        <DiffExprResults experimentId='1234' onGoBack={jest.fn()} cellSets={cellSets} width={100} height={200} />
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
    const FOCUSED_GENE = 'CEMIP';

    // Redefine store from `beforeEach`.
    const component = mount(
      <Provider store={store}>
        <DiffExprResults experimentId='1234' onGoBack={jest.fn()} cellSets={cellSets} width={100} height={200} />
      </Provider>,
    );

    const table = component.find('Space Table Table');

    table.getElement().props.data.forEach((row) => {
      if (row.gene_names === FOCUSED_GENE) {
        expect(row.lookup.props.focused).toEqual(true);
      } else {
        expect(row.lookup.props.focused).toEqual(false);
      }
    });
  });
});
