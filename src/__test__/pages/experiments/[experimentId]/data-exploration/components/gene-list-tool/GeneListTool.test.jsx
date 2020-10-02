import React from 'react';
import { mount, configure } from 'enzyme';
import { act } from 'react-dom/test-utils';
import Adapter from 'enzyme-adapter-react-16';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import preloadAll from 'jest-next-dynamic';
import thunk from 'redux-thunk';
import _ from 'lodash';
import { ExclamationCircleFilled } from '@ant-design/icons';
import waitForActions from 'redux-mock-store-await-actions';
import GeneListTool from '../../../../../../../pages/experiments/[experimentId]/data-exploration/components/gene-list-tool/GeneListTool';
import { fetchCachedWork } from '../../../../../../../utils/cacheRequest';

import { GENES_PROPERTIES_LOADING, GENES_PROPERTIES_LOADED_PAGINATED, GENES_SELECT } from '../../../../../../../redux/actionTypes/genes';

jest.mock('localforage');

jest.mock('../../../../../../../utils/cacheRequest', () => ({
  fetchCachedWork: jest.fn(() => new Promise((resolve) => resolve({
    rows: [{
      gene_names: 'R3ALG3N3',
      dispersions: 12.3131,
    }],
    total: 1,
  }))),
}));

const mockStore = configureMockStore([thunk]);
let component;
let store;

const TEST_UUID = 'testList';

const initialState = {
  genes: {
    properties: {
      loading: [],
      data: {
        CEMIP: { dispersions: 3.999991789324 },
        TIMP3: { dispersions: 3.4388329 },
        SMYD3: { dispersions: 3.1273264798 },
        I: { dispersions: 0.08756543 },
        J: { dispersions: 1.352342342 },
        K: { dispersions: 33.423142314 },
      },
      views: {
        [TEST_UUID]: {
          fetching: false,
          error: false,
          total: 4,
          data: ['J', 'I', 'K', 'CEMIP'],
        },
      },
    },
    expression: {
      loading: [],
      error: false,
      data: {},
    },
    selected: [],
    focused: undefined,
  },
};

describe('GeneListTool', () => {
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

    store = mockStore(initialState);

    component = mount(
      <Provider store={store}>
        <GeneListTool experimentId='1234' uuid={TEST_UUID} width={100} height={200} />
      </Provider>,
    );
  });

  afterEach(() => {
    component.unmount();
  });

  configure({ adapter: new Adapter() });
  it('renders correctly', () => {
    const table = component.find('Table Table');
    const spin = component.find('Table Spin');
    const genesFilter = component.find('FilterGenes');
    expect(spin.length).toEqual(1);
    expect(table.length).toEqual(1);
    expect(genesFilter.length).toEqual(1);
    expect(table.getElement().props.columns.length).toEqual(3);
    expect(table.getElement().props.columns[0].key).toEqual('lookup');
    expect(table.getElement().props.columns[1].title).toEqual('Gene');
    expect(table.getElement().props.columns[2].title).toEqual('Dispersion');
    expect(table.getElement().props.dataSource.length).toEqual(
      initialState.genes.properties.views[TEST_UUID].data.length,
    );
    expect(table.getElement().props.data.length).toEqual(
      initialState.genes.properties.views[TEST_UUID].data.length,
    );
  });

  it('all genes from the first page are selected by default on load', async () => {
    expect(store.getActions()[1]).toMatchSnapshot();
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

    const table = component.find('Table Table');

    act(() => {
      table.getElement().props.onChange(newPagination, {}, newSorter);
    });

    // Wait for side-effect to propagate (properties loading and loaded).
    await waitForActions(store, [GENES_PROPERTIES_LOADING, GENES_SELECT, GENES_PROPERTIES_LOADED_PAGINATED]);

    expect(fetchCachedWork).toHaveBeenCalledWith('1234', 30, {
      limit: 4,
      name: 'ListGenes',
      offset: 0,
      orderBy: 'gene_names',
      orderDirection: 'ASC',
      selectFields: ['gene_names', 'dispersions'],
    });

    expect(store.getActions()[0]).toMatchSnapshot();
    expect(store.getActions()[2]).toMatchSnapshot();
  });

  it('All `eye` buttons are initially unfocused.', () => {
    const table = component.find('Space Table Table');

    table.getElement().props.data.forEach((row) => {
      expect(row.lookup.props.focused).toEqual(false);
    });
  });

  it('Clicking one of the `eye` buttons triggers appropriate onChange actions.', () => {
    const table = component.find('Space Table Table');

    const { onClick } = table.getElement().props.data[2].lookup.props;

    // trigger clicking
    onClick();

    // The store should have been updated.
    expect(store.getActions().length).toEqual(4);
    expect(store.getActions()[3]).toMatchSnapshot();
  });

  it('Having a focused gene triggers focused view for `eye` button.', () => {
    const FOCUSED_GENE = 'CEMIP';

    // Redefine store from `beforeEach`.
    store = mockStore({
      ...initialState,
      genes: { ...initialState.genes, focused: FOCUSED_GENE },
    });

    component = mount(
      <Provider store={store}>
        <GeneListTool experimentId='1234' uuid={TEST_UUID} width={100} height={200} />
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

  it('error state renders correctly', () => {
    const newInitialState = _.cloneDeep(initialState);
    newInitialState.genes.properties.views[TEST_UUID].error = 'asd';
    store = mockStore(newInitialState);

    component = mount(
      <Provider store={store}>
        <GeneListTool experimentId='1234' uuid={TEST_UUID} width={100} height={200} />
      </Provider>,
    );

    expect(component.find(ExclamationCircleFilled).length).toEqual(1);
  });
});
