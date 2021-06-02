import React from 'react';
import { mount, configure } from 'enzyme';
import { Provider } from 'react-redux';
import Adapter from 'enzyme-adapter-react-16';
import { Dropdown } from 'antd';
import waitForActions from 'redux-mock-store-await-actions';
import thunk from 'redux-thunk';
import preloadAll from 'jest-next-dynamic';
import configureMockStore from 'redux-mock-store';
import ComponentActions from '../../../../components/data-exploration/generic-gene-table/ComponentActions';
import { fetchCachedWork } from '../../../../utils/cacheRequest';

import { GENES_EXPRESSION_LOADING, GENES_EXPRESSION_LOADED } from '../../../../redux/actionTypes/genes';

jest.mock('localforage');
jest.mock('../../../../utils/cacheRequest', () => ({
  fetchCachedWork: jest.fn(() => new Promise((resolve) => resolve({
    A: {
      min: 0,
      max: 1.6,
      expression: [0, 0.4, 0.5, 1.6],
    },
    B: {
      min: 0,
      max: 1.6,
      expression: [0, 0.4, 0.5, 1.6],
    },
    C: {
      min: 0,
      max: 1.6,
      expression: [0, 0.4, 0.5, 1.6],
    },
  }))),
}));

const mockStore = configureMockStore([thunk]);
configure({ adapter: new Adapter() });

let component;
const experimentId = '1234';
const componentType = 'asd';

const initialState = {
  genes: {
    expression: {
      loading: [],
      data: {
        D: {
          min: 0,
          max: 1.6,
          expression: [0, 0.4, 0.5, 1.6],
        },
        E: {
          min: 0,
          max: 1.6,
          expression: [0, 0.4, 0.5, 1.6],
        },
      },
      views: {
        [componentType]: {
          data: ['D', 'E'],
          fetching: false,
          error: false,
        },
      },
    },
    selected: ['A'],
  },
  experimentSettings: {
    backendStatus: {
      status: {
        pipeline: {
          status: 'SUCCEEDED',
          startDate: '2021-01-01T01:01:01.000Z',
        },
      },
    },
  },
};

describe('ComponentActions', () => {
  beforeAll(async () => {
    await preloadAll();
  });

  afterEach(() => {
    component.unmount();
    jest.clearAllMocks();
  });

  it('Renders correctly when there are selected genes', () => {
    const store = mockStore(initialState);

    component = mount(
      <Provider store={store}>
        <ComponentActions name='fakeName' experimentId={experimentId} componentType={componentType} />
      </Provider>,
    );

    const dropdown = component.find(Dropdown);
    expect(dropdown.length).toEqual(1);
    expect(dropdown.props().overlay.type.name).toEqual('Menu');
    expect(dropdown.props().overlay.props.children.length).toEqual(3);
  });

  it('Renders correctly when there are no selected genes', () => {
    const store = mockStore({
      ...initialState,
      genes: {
        ...initialState.genes,
        selected: [],
      },
    });

    component = mount(
      <Provider store={store}>
        <ComponentActions name='fakeName' experimentId={experimentId} componentType={componentType} />
      </Provider>,
    );

    expect(component.find(Dropdown).length).toEqual(0);
  });

  it('Dispatches loadGeneExpression action with the right list of genes when Add is clicked', async () => {
    const store = mockStore({
      ...initialState,
      genes: {
        ...initialState.genes,
        selected: ['A', 'B', 'C'],
      },
    });

    component = mount(
      <Provider store={store}>
        <ComponentActions name='fakeName' experimentId={experimentId} componentType={componentType} />
      </Provider>,
    );

    const menuButtons = component.find(Dropdown).props().overlay;
    menuButtons.props.children[0].props.onClick();

    // Wait for side-effect to propagate (properties loading and loaded).
    await waitForActions(store, [GENES_EXPRESSION_LOADING, GENES_EXPRESSION_LOADED]);

    expect(fetchCachedWork).toHaveBeenCalledWith(
      experimentId, 30,
      {
        name: 'GeneExpression',
        genes: ['A', 'B', 'C'],
      },
      '2021-01-01T01:01:01.000Z',
    );

    expect(store.getActions().length).toEqual(2);

    expect(store.getActions()[0]).toMatchSnapshot();

    expect(store.getActions()[1]).toMatchSnapshot();
  });

  it('Dispatches loadGeneExpression action with the right list of genes when Remove is clicked', async () => {
    const store = mockStore({
      ...initialState,
      genes: {
        ...initialState.genes,
        selected: ['D'],
      },
    });

    component = mount(
      <Provider store={store}>
        <ComponentActions name='fakeName' experimentId={experimentId} componentType={componentType} />
      </Provider>,
    );

    const menuButtons = component.find(Dropdown).props().overlay;
    menuButtons.props.children[1].props.onClick();

    // Wait for side-effect to propagate (properties loading and loaded).
    await waitForActions(store, [GENES_EXPRESSION_LOADING, GENES_EXPRESSION_LOADED]);

    expect(fetchCachedWork).toHaveBeenCalledTimes(0);

    expect(store.getActions().length).toEqual(2);

    expect(store.getActions()[0]).toMatchSnapshot();

    expect(store.getActions()[1]).toMatchSnapshot();
  });

  it('Dispatches loadGeneExpression action with the right list of genes when Overwrite is clicked', async () => {
    const store = mockStore({
      ...initialState,
      genes: {
        ...initialState.genes,
        selected: ['D'],
      },
    });

    component = mount(
      <Provider store={store}>
        <ComponentActions name='fakeName' experimentId={experimentId} componentType={componentType} />
      </Provider>,
    );

    const menuButtons = component.find(Dropdown).props().overlay;
    menuButtons.props.children[2].props.onClick();

    // Wait for side-effect to propagate (properties loading and loaded).
    await waitForActions(store, [GENES_EXPRESSION_LOADING, GENES_EXPRESSION_LOADED]);

    expect(fetchCachedWork).toHaveBeenCalledTimes(0);

    expect(store.getActions().length).toEqual(2);
    expect(store.getActions()[0]).toMatchSnapshot();
    expect(store.getActions()[1]).toMatchSnapshot();
  });
});
