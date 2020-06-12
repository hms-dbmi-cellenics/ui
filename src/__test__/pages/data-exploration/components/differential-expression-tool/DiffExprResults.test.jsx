/* eslint-env jest */

import React from 'react';
import { shallow, mount, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import preloadAll from 'jest-next-dynamic';
import { act } from 'react-dom/test-utils';
import {
  Provider,
} from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import {
  Form, Select, Radio, Button,
} from 'antd';
import DiffExprResults from '../../../../../pages/data-exploration/components/differential-expression-tool/DiffExprResults';


const mockStore = configureMockStore([thunk]);

const store = mockStore({
  diffExpr: {
    allData: [
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
    total: 5,
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
  test('renders correctly', () => {
    const component = mount(
      <Provider store={store}>
        <DiffExprResults experimentID='1234' onGoBack={jest.fn()} />
      </Provider>,
    );

    const table = component.find('Table Table');
    const spin = component.find('Table Spin');
    expect(spin.length).toEqual(1);
    expect(table.length).toEqual(1);
    expect(table.getElement().props.columns.length).toEqual(4);
    expect(table.getElement().props.columns[0].title).toEqual('Gene');
    expect(table.getElement().props.columns[1].title).toEqual('pValue');
    expect(table.getElement().props.columns[2].title).toEqual('qValue');
    expect(table.getElement().props.columns[3].title).toEqual('Log2 Fold Change');

    expect(table.getElement().props.dataSource.length).toEqual(5);
    expect(table.getElement().props.data.length).toEqual(5);
  });
});
