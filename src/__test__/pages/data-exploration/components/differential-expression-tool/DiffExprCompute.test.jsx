import React from 'react';
import { mount, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import preloadAll from 'jest-next-dynamic';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import {
  Form, Select, Button,
} from 'antd';
import DiffExprCompute from '../../../../../pages/data-exploration/components/differential-expression-tool/DiffExprCompute';

jest.mock('localforage');
jest.mock('../../../../../utils/environment', () => false);

const { Item } = Form;
const mockStore = configureMockStore([thunk]);

const store = mockStore({
  cellSets: {
    properties: {
      'cluster-a': {
        name: 'cluster a',
        key: 'cluster-a',
        cellIds: ['one', 'two'],
        color: '#00FF00',
      },
      'cluster-b': {
        name: 'cluster b',
        key: 'cluster-b',
        cellIds: ['three', 'four', 'five'],
        color: '#FF0000',
      },
      'cluster-c': {
        name: 'cluster c',
        key: 'cluster-c',
        cellIds: ['six'],
        color: '#0000FF',
      },
      louvain: {
        name: 'Louvain clusters',
        key: 'louvain',
        rootNode: true,
        children: [],
      },
      scratchpad: {
        name: 'Custom selections',
        key: 'scratchpad',
        rootNode: true,
        children: [],
      },
    },
    hierarchy: [
      {
        key: 'louvain',
        children: ['cluster-a', 'cluster-b', 'cluster-c'],
      },
      {
        key: 'scratchpad',
      },
    ],
  },
});

describe('DiffExprCompute', () => {
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
  it('renders correctly with no comparison method', () => {
    const component = mount(
      <Provider store={store}>
        <DiffExprCompute
          experimentId='1234'
          selection={{ first: 'Select a cell set', second: 'Select a cell set' }}
          onCompute={jest.fn()}
        />
      </Provider>,
    );

    const form = component.find(Form);

    // There should be one form.
    expect(form.length).toEqual(1);

    // It should have two items.
    expect(form.find(Item).length).toEqual(3);

    // The first one should be a radio group titled Compare
    expect(form.find(Item).at(0).getElement().props.label).toEqual('Compare:');

    // The second one should be a disabled button.
    const button = form.find(Button);
    expect(button.length).toEqual(1);
    expect(button.getElement().props.disabled).toEqual(true);
  });

  it('renders correctly with versus rest comparison method', () => {
    const component = mount(
      <Provider store={store}>
        <DiffExprCompute
          experimentId='1234'
          selection={{ first: 'Select a cell set', second: 'Select a cell set' }}
          comparison='Versus rest'
          onCompute={jest.fn()}
        />
      </Provider>,
    );

    const form = component.find(Form);

    expect(form.length).toEqual(1);
    expect(form.find(Item).length).toEqual(3);

    expect(form.find(Item).at(0).getElement().props.label).toEqual('Compare:');

    // Second item is now a single select.
    expect(form.find(Item).at(1).find(Select).length).toEqual(1);

    const button = form.find(Item).at(2).find(Button);
    expect(button.length).toEqual(1);
    expect(button.getElement().props.disabled).toEqual(true);
  });

  it('renders correctly with across sets comparison method', () => {
    const component = mount(
      <Provider store={store}>
        <DiffExprCompute
          experimentId='1234'
          selection={{ first: 'Select a cell set', second: 'Select a cell set' }}
          comparison='Across sets'
          onCompute={jest.fn()}
        />
      </Provider>,
    );

    const form = component.find(Form);

    expect(form.length).toEqual(1);
    expect(form.find(Item).length).toEqual(3);

    expect(form.find(Item).at(0).getElement().props.label).toEqual('Compare:');

    expect(form.find(Item).at(1).find(Select).length).toEqual(1);

    const button = form.find(Button);
    expect(button.length).toEqual(1);
    expect(button.getElement().props.disabled).toEqual(true);
  });

  it('the select options render correctly', () => {
    const component = mount(
      <Provider store={store}>
        <DiffExprCompute
          experimentId='1234'
          selection={{ first: 'Select a cell set', second: 'Select a cell set' }}
          comparison='Versus rest'
          onCompute={jest.fn()}
        />
      </Provider>,
    );

    // Find the option groups
    const select = component.find(Form).find(Item).at(1).find(Select)
      .getElement();

    // There should be two, one per root category.
    expect(select.props.children.length).toEqual(2);

    // The default value should be displayed initially.
    expect(select.props.value).toEqual('Select a cell set');

    // The labels should be appropriately generated.
    select.props.children.forEach((rootNode, i) => {
      const { key, label } = rootNode;

      expect(key === store.getState().cellSets.hierarchy[i]);
      expect(label === store.getState().cellSets.properties[key].name);
    });
  });

  it('renders correctly with previously selected clusters', () => {
    const component = mount(
      <Provider store={store}>
        <DiffExprCompute
          experimentId='1234'
          selection={{ first: 'cluster-a', second: 'cluster-b' }}
          comparison='Across sets'
          onCompute={jest.fn()}
        />
      </Provider>,
    );

    const form = component.find(Form);
    const firstSelected = form.find(Item).at(0).find(Select).at(0)
      .getElement();
    const secondSelected = form.find(Item).at(1).find(Select).at(0)
      .getElement();

    expect(firstSelected.props.value).toEqual('cluster-a');
    expect(secondSelected.props.value).toEqual('cluster-b');

    expect(form.find(Button)
      .getElement().props.disabled).toEqual(false);
  });

  it('button is disabled when second select is not selected', () => {
    const component = mount(
      <Provider store={store}>
        <DiffExprCompute
          experimentId='1234'
          selection={{ first: 'cluster-a', second: 'Select a cell set' }}
          comparison='Versus rest'
          onCompute={jest.fn()}
        />
      </Provider>,
    );

    const form = component.find(Form);
    const firstSelected = form.find(Item).at(0).find(Select).at(0);
    const secondSelected = form.find(Item).at(1).find(Select).at(0);

    expect(firstSelected.getElement().props.value).toEqual('cluster-a');
    expect(secondSelected.getElement().props.value).toEqual('Select a cell set');
    expect(form.find(Button)
      .getElement().props.disabled).toEqual(true);
  });
});
