/* eslint-env jest */

import React from 'react';
import { mount, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import preloadAll from 'jest-next-dynamic';
import thunk from 'redux-thunk';
import GeneListTool from '../../../../../pages/data-exploration/components/gene-list-tool/GeneListTool';
import connectionPromise from '../../../../../utils/socketConnection';

jest.mock('../../../../../utils/socketConnection');

let io;
let mockOn;
let mockEmit;

connectionPromise.mockImplementation(() => new Promise((resolve) => {
  resolve(io);
}));

const mockStore = configureMockStore([thunk]);
let component;
let store;

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

    store = mockStore({
      geneList: {
        loading: false,
        rows: [
          {
            gene_names: 'CEMIP',
            dispersions: 3.999991789324,
            key: 'CEMIP',
          },
          {
            gene_names: 'TIMP3',
            dispersions: 3.4388329,
            key: 'TIMP3',
          },
          {
            gene_names: 'SMYD3',
            dispersions: 3.1273264798,
            key: 'SMYD3',
          },
          {
            gene_names: 'CHI3L1',
            dispersions: 2.3248394823,
            key: 'CHI3L1',
          },
          {
            gene_names: 'NEAT1',
            dispersions: 3.3243243231,
            key: 'NEAT1',
          },
          {
            gene_names: 'GPC6',
            dispersions: 1.8934782,
            key: 'GPC6',
          },
          {
            gene_names: 'CEMIP',
            dispersions: 0.6854982354,
            key: 'CEMIP',
          },
          {
            gene_names: 'A',
            dispersions: 0.454705249,
            key: 'A',
          },
          {
            gene_names: 'B',
            dispersions: 1.4854934373,
            key: 'B',
          },
          {
            gene_names: 'C',
            dispersions: 2.12143434322,
            key: 'C',
          },
          {
            gene_names: 'D',
            dispersions: 0.8423643682427,
            key: 'D',
          },
          {
            gene_names: 'E',
            dispersions: 2.869048545643,
            key: 'E',
          },
          {
            gene_names: 'F',
            dispersions: 1.3456954368039,
            key: 'F',
          },
          {
            gene_names: 'G',
            dispersions: 0.5865059484,
            key: 'G',
          },
          {
            gene_names: 'H',
            dispersions: -0.4884802,
            key: 'H',
          },
          {
            gene_names: 'I',
            dispersions: 0.08756543,
            key: 'I',
          },
          {
            gene_names: 'J',
            dispersions: -0.12243687564,
            key: 'J',
          },
          {
            gene_names: 'K',
            dispersions: 0.46765344343,
            key: 'K',
          },
          {
            gene_names: 'L',
            dispersions: -0.545768743,
            key: 'L',
          },
        ],
        tableState: {
          pagination: {
            current: 1,
            pageSize: 15,
            showSizeChanger: true,
            total: 19,
          },
          sorter: {
            field: 'dispersions',
            order: 'descend',
          },
        },
      },
    });

    component = mount(
      <Provider store={store}>
        <GeneListTool experimentID='1234' />
      </Provider>,
    );
  });

  afterEach(() => {
    component.unmount();
  });

  configure({ adapter: new Adapter() });
  test('renders correctly', () => {
    const table = component.find('Table Table');
    const spin = component.find('Table Spin');
    const genesFilter = component.find('FilterGenes');
    expect(spin.length).toEqual(1);
    expect(table.length).toEqual(1);
    expect(genesFilter.length).toEqual(1);
    expect(table.getElement().props.columns.length).toEqual(2);
    expect(table.getElement().props.columns[0].title).toEqual('Gene');
    expect(table.getElement().props.columns[1].title).toEqual('Dispersion');
    expect(table.getElement().props.dataSource.length).toEqual(19);
    expect(table.getElement().props.data.length).toEqual(15);
  });

  test('can sort the gene names in alphabetical order', () => {
    const newPagination = {
      current: 1,
      pageSize: 15,
      showSizeChanger: true,
      total: 19,
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

    const finished = new Promise((resolve, reject) => {
    });

    mockOn = jest.fn(async (x, f) => {
      const res = {
        results: [
          {
            body: JSON.stringify({
              rows: [{
                key: '1',
                gene_names: 'a mock name',
              }],
              total: [],
            }),
          },
        ],
      };
      f(res).then((result) => {
        finished.resolve(result);
      }).catch((e) => { console.log('****** ', e); finished.reject(e); });
    });

    mockEmit = jest.fn();

    io = {
      emit: mockEmit,
      on: mockOn,
    };

    const table = component.find('Table Table');
    const _ = {};
    table.getElement().props.onChange(newPagination, _, newSorter);
    table.update();

    finished.then((result) => {
      console.log(result);
      expect(store.getActions().length).toEqual(2);
      expect(store.getActions()[0].type).toEqual('GENE_LIST.LOAD');
      expect(store.getActions()[1].type).toEqual('GENE_LIST.UPDATE');
      expect(mockEmit).toHaveBeenCalledWith('WorkRequest');
      expect(mockEmit).toHaveBeenCalledTimes(1);
      expect(mockOn).toHaveBeenCalledTimes(1);
    });
  });
});
