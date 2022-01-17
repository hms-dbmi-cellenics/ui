import React from 'react';
import { mount } from 'enzyme';
import '__test__/test-utils/setupTests';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import {
  Form, Radio, Button, Select,
} from 'antd';
import DiffExprCompute from '../../../../components/data-exploration/differential-expression-tool/DiffExprCompute';
import {
  DIFF_EXPR_COMPARISON_TYPE_SET,
} from '../../../../redux/actionTypes/differentialExpression';

const { Item } = Form;

const mockStore = configureMockStore([thunk]);

const initialState = {
  cellSets: {
    properties: {
      'cluster-a': {
        name: 'cluster a',
        key: 'cluster-a',
        cellIds: new Set([1, 2]),
        color: '#00FF00',
      },
      'cluster-b': {
        name: 'cluster b',
        key: 'cluster-b',
        cellIds: new Set([3, 4, 5]),
        color: '#FF0000',
      },
      'cluster-c': {
        name: 'cluster c',
        key: 'cluster-c',
        cellIds: new Set([6]),
        color: '#0000FF',
      },
      'sample-a': {
        name: 'sample a',
        key: 'sample-a',
        cellIds: new Set([1, 2]),
        color: '#00FF00',
      },
      'sample-b': {
        name: 'sample b',
        key: 'sample-b',
        cellIds: new Set([3, 4, 5]),
        color: '#FF0000',
      },
      'sample-c': {
        name: 'sample c',
        key: 'sample-c',
        cellIds: new Set([6]),
        color: '#0000FF',
      },
      louvain: {
        name: 'Louvain clusters',
        key: 'louvain',
        type: 'cellSets',
        cellIds: new Set(),
        rootNode: true,
      },
      scratchpad: {
        name: 'Custom selections',
        key: 'scratchpad',
        type: 'cellSets',
        cellIds: new Set(),
        rootNode: true,
      },
      sample: {
        name: 'Samples',
        key: 'sample',
        type: 'metadataCategorical',
        cellIds: new Set(),
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
  differentialExpression: {
    properties: {
      data: [],
      comparisonGroup: {},
      loading: false,
      error: false,
      total: 0,
    },
    comparison: {
      type: 'between',
      group: {
        between: {
          cellSet: null,
          compareWith: null,
          basis: null,
        },
      },
    },
  },
};

describe('DiffExprCompute', () => {
  it('renders correctly with no comparison method', () => {
    const store = mockStore(initialState);

    const component = mount(
      <Provider store={store}>
        <DiffExprCompute
          experimentId='1234'
          comparisonGroup={{ cellSet: null, compareWith: null, basis: null }}
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
    // MockStore can not update state, therefore the store here reflects changes after click
    // and click is checked by action
    const store = mockStore(() => ({
      ...initialState,
      differentialExpression: {
        ...initialState.differentialExpression,
        comparison: {
          ...initialState.differentialExpression.comparison,
          type: 'within',
          group: {
            within: {
              cellSet: null,
              compareWith: null,
              basis: null,
            },
          },
        },
      },
    }));

    const component = mount(
      <Provider store={store}>
        <DiffExprCompute
          experimentId='1234'
          comparisonGroup={{ cellSet: null, compareWith: null, basis: null }}
          onCompute={jest.fn()}
        />
      </Provider>,
    );

    const form = component.find(Form);

    // There should be one form.
    expect(form.length).toEqual(1);

    // It should have a radio button group at the top
    expect(form.find(Radio.Group).length).toEqual(1);

    // Clicking on the second one should re-render the tool.
    const { onChange } = form.find(Radio.Group).getElement().props;

    onChange({ target: { value: 'within' } });

    // Check if the correct actions are fired
    expect(store.getActions()[0].type).toEqual(DIFF_EXPR_COMPARISON_TYPE_SET);

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
    const store = mockStore(initialState);

    const component = mount(
      <Provider store={store}>
        <DiffExprCompute
          experimentId='1234'
          comparisonGroup={{ cellSet: 'sample/sample-a', compareWith: null, basis: null }}
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
