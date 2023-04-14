import React from 'react';
import { mount } from 'enzyme';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import preloadAll from 'jest-next-dynamic';
import thunk from 'redux-thunk';
import _ from 'lodash';
import { Empty } from 'antd';
import GeneListTool from 'components/data-exploration/gene-list-tool/GeneListTool';

import Loader from 'components/Loader';

jest.mock('utils/getTimeoutForWorkerTask', () => ({
  __esModule: true, // this property makes it work
  default: () => 60,
}));

jest.mock('utils/work/fetchWork', () => ({
  fetchWork: jest.fn(() => new Promise((resolve) => resolve({
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

const experimentId = '1234';

const TEST_UUID = 'testList';

const backendStatus = {
  [experimentId]: {
    status: {
      pipeline: {
        status: 'SUCCEEDED',
        startDate: '2021-01-01T01:01:01.000Z',
      },
    },
  },
};

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
      views: {},
    },
    selected: [],
  },
  cellInfo: {
    focus: {
      key: null,
      store: null,
    },
  },
  backendStatus,
};

const eventStub = { stopPropagation: () => null };

describe('GeneListTool', () => {
  beforeAll(async () => {
    await preloadAll();
  });

  beforeEach(() => {
    store = mockStore(initialState);

    component = mount(
      <Provider store={store}>
        <GeneListTool experimentId={experimentId} uuid={TEST_UUID} width={100} height={200} />
      </Provider>,
    );
  });

  afterEach(() => {
    component.unmount();
  });

  it('renders correctly', () => {
    const table = component.find('Table');
    const spin = component.find(Loader);
    const genesFilter = component.find('FilterGenes');
    expect(spin.length).toEqual(0);
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

  it('All `eye` buttons are initially unfocused.', () => {
    const table = component.find('Table');

    table.getElement().props.data.forEach((row) => {
      const lookupComponent = mount(
        <Provider store={store}>
          {row.lookup}
        </Provider>,
      );

      const focusButtonTooltip = lookupComponent.find('FocusButton Tooltip');
      expect(focusButtonTooltip.props().title).toContain('Show');
      expect(focusButtonTooltip.props().title).not.toContain('Hide');

      lookupComponent.unmount();
    });
  });

  it('Clicking one of the `eye` buttons triggers appropriate onChange actions.', () => {
    const table = component.find('Table');

    // Render the appropriate `lookup` component
    const lookupComponent = mount(
      <Provider store={store}>
        {table.getElement().props.data[2].lookup}
      </Provider>,
    );

    // Get focus button
    const button = lookupComponent.find('FocusButton Tooltip Button');

    // Simulate clicking
    button.simulate('click', eventStub);

    expect(store.getActions().length).toEqual(3);
    expect(store.getActions()[2]).toMatchSnapshot();

    lookupComponent.unmount();
  });

  it('Having a focused gene triggers focused view for `eye` button.', () => {
    const FOCUSED_GENE = 'CEMIP';

    // Redefine store from `beforeEach`.
    store = mockStore({
      ...initialState,
      cellInfo: {
        ...initialState.cellInfo,
        focus: {
          ...initialState.cellInfo.focus,
          store: 'genes',
          key: FOCUSED_GENE,
        },
      },
    });

    component = mount(
      <Provider store={store}>
        <GeneListTool experimentId={experimentId} uuid={TEST_UUID} width={100} height={200} />
      </Provider>,
    );

    const table = component.find('Table');

    table.getElement().props.data.forEach((row) => {
      const lookupComponent = mount(
        <Provider store={store}>
          {row.lookup}
        </Provider>,
      );

      const focusButtonTooltip = lookupComponent.find('FocusButton Tooltip');

      if (row.gene_names === FOCUSED_GENE) {
        expect(focusButtonTooltip.props().title).toContain('Hide');
      } else {
        expect(focusButtonTooltip.props().title).toContain('Show');
      }

      lookupComponent.unmount();
    });
  });

  it('error state renders correctly', () => {
    const newInitialState = _.cloneDeep(initialState);
    newInitialState.genes.properties.views[TEST_UUID].error = 'asd';
    store = mockStore(newInitialState);

    component = mount(
      <Provider store={store}>
        <GeneListTool experimentId={experimentId} uuid={TEST_UUID} width={100} height={200} />
      </Provider>,
    );

    expect(component.find(Empty).length).toEqual(1);
  });
});
