import React from 'react';
import { mount, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import preloadAll from 'jest-next-dynamic';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import {
  Form, Radio, Button, Select,
} from 'antd';
import DiffExprCompute from '../../../../../../../pages/experiments/[experimentId]/data-exploration/components/differential-expression-tool/DiffExprCompute';

jest.mock('localforage');
jest.mock('../../../../../../../utils/environment', () => false);

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
      'sample-a': {
        name: 'sample a',
        key: 'sample-a',
        cellIds: ['one', 'two'],
        color: '#00FF00',
      },
      'sample-b': {
        name: 'sample b',
        key: 'sample-b',
        cellIds: ['three', 'four', 'five'],
        color: '#FF0000',
      },
      'sample-c': {
        name: 'sample c',
        key: 'sample-c',
        cellIds: ['six'],
        color: '#0000FF',
      },
      louvain: {
        name: 'Louvain clusters',
        key: 'louvain',
        type: 'cellSets',
        cellIds: [],
        rootNode: true,
      },
      scratchpad: {
        name: 'Custom selections',
        key: 'scratchpad',
        type: 'cellSets',
        cellIds: [],
        rootNode: true,
      },
      sample: {
        name: 'Samples',
        key: 'sample',
        type: 'metadataCategorical',
        cellIds: [],
        rootNode: true,
      },
    },
    hierarchy: [
      {
        key: 'louvain',
        children: [{ key: 'cluster-a' }, { key: 'cluster-b' }, { key: 'cluster-c' }],
      },
      {
        key: 'sample',
        children: [{ key: 'sample-a' }, { key: 'sample-b' }, { key: 'sample-c' }],
      },
      {
        key: 'scratchpad',
        children: [],
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
          cellSets={{ cellSet: null, compareWith: null, basis: null }}
          onCompute={jest.fn()}
        />
      </Provider>,
    );

    const form = component.find(Form);

    // There should be one form.
    expect(form.length).toEqual(1);

    // It should have a radio button group at the top
    expect(form.find(Radio.Group).length).toEqual(1);

    // It should have four items with the particular values.
    expect(form.find(Item).length).toEqual(4);
    expect(form.find(Item).at(0).getElement().props.label).toEqual('Compare cell set:');
    expect(form.find(Item).at(1).getElement().props.label).toEqual('between sample/group:');
    expect(form.find(Item).at(2).getElement().props.label).toEqual('and sample/group:');

    // The second one should be a disabled button.
    const button = form.find(Button);
    expect(button.length).toEqual(1);
    expect(button.getElement().props.disabled).toEqual(true);
  });

  it('clicking on the second comparison option changes items in form', () => {
    const component = mount(
      <Provider store={store}>
        <DiffExprCompute
          experimentId='1234'
          cellSets={{ cellSet: null, compareWith: null, basis: null }}
          onCompute={jest.fn()}
        />
      </Provider>,
    );

    let form = component.find(Form);

    // There should be one form.
    expect(form.length).toEqual(1);

    // It should have a radio button group at the top
    expect(form.find(Radio.Group).length).toEqual(1);

    // Clicking on the second one should re-render the tool.
    const { onChange } = form.find(Radio.Group).getElement().props;

    onChange({ target: { value: 'within' } });

    component.update();
    form = component.find(Form);

    // The form should still have four items.
    expect(form.find(Item).length).toEqual(4);

    // It should have four items with different labels.
    expect(form.find(Item).at(0).getElement().props.label).toEqual('Compare cell set:');
    expect(form.find(Item).at(1).getElement().props.label).toEqual('and cell set:');
    expect(form.find(Item).at(2).getElement().props.label).toEqual('within sample/group:');

    // The second one should be a disabled button.
    const button = form.find(Button);
    expect(button.length).toEqual(1);
    expect(button.getElement().props.disabled).toEqual(true);
  });

  it('the `versus` option renders correctly when a set is already selected', () => {
    const component = mount(
      <Provider store={store}>
        <DiffExprCompute
          experimentId='1234'
          cellSets={{ cellSet: 'sample/sample-a', compareWith: null, basis: null }}
          comparison='Versus rest'
          onCompute={jest.fn()}
        />
      </Provider>,
    );

    // Find the option groups
    const selectField = component.find(Select).at(2).getElement().props.children;
    expect(selectField.length).toEqual(3);

    // The first one should not be rendered.
    expect(selectField[0]).toEqual(false);

    // The second one should be the 'background' option.
    expect(selectField[1].key).toEqual('background');

    // The third one should be the other metadata.
    const metadata = selectField[2];

    // The hierarchy should match.
    metadata.forEach((rootNode, i) => {
      expect(rootNode.key === store.getState().cellSets.hierarchy[i]);
      expect(rootNode.props.label === store.getState().cellSets.properties[rootNode.key].name);
    });
  });
});
