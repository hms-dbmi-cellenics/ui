import React from 'react';
import { mount } from 'enzyme';
import _ from 'lodash';
import { Button, Typography } from 'antd';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';
import configureMockStore from 'redux-mock-store';
import SelectionActions from '../../../../components/data-exploration/generic-gene-table/SelectionActions';
import { GENES_DESELECT } from '../../../../redux/actionTypes/genes';
import '__test__/test-utils/setupTests';

const { Text } = Typography;

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
    },
    expression: {
      loading: [],
      error: false,
      data: {},
      views: {},
    },
    selected: [],
    focused: undefined,
  },
};

const mockStore = configureMockStore([thunk]);

describe('SelectionIndicator', () => {
  test('renders correctly with no selected genes', () => {
    const store = mockStore(initialState);
    const component = mount(
      <Provider store={store}>
        <SelectionActions experimentId='test' />
      </Provider>,
    );
    const button = component.find(Button);
    const text = component.find(Text);

    // There should be no button loaded.
    expect(button.length).toEqual(0);

    // There should be no text loaded.
    expect(text.length).toEqual(0);
  });

  test('renders correctly with selected genes ', () => {
    const state = _.cloneDeep(initialState);
    state.genes.selected = ['CEMIP'];

    const store = mockStore(state);
    const component = mount(
      <Provider store={store}>
        <SelectionActions experimentId='test' />
      </Provider>,
    );
    const button = component.find(Button);
    const text = component.find(Text);
    // There should be 4 buttons.
    expect(button.length).toEqual(4);

    // A clear button
    expect(button.at(0).childAt(0).text()).toEqual('Clear');

    // And a copy to clipboard button
    expect(button.at(1).childAt(0).text()).toEqual('Copy');

    // A list selected button
    expect(button.at(2).childAt(0).text()).toEqual('List');

    // And a Heatmap button
    expect(button.at(3).childAt(0).text()).toEqual('Heatmap');

    // The text should be loaded.
    expect(text.length).toEqual(1);
    expect(text.childAt(0).text()).toEqual('1 gene selected');
  });

  test('selected genes are cleared when clear button is pressed', () => {
    const state = _.cloneDeep(initialState);
    state.genes.selected = ['CEMIP', 'TIMP3'];

    const store = mockStore(state);
    const component = mount(
      <Provider store={store}>
        <SelectionActions experimentId='test' />
      </Provider>,
    );
    const clearSelectedButton = component.find(Button).at(0);
    clearSelectedButton.simulate('click');
    const firstAction = store.getActions()[0];
    expect(firstAction.type).toEqual(GENES_DESELECT);
    expect(firstAction).toMatchSnapshot();
  });

  test('renders correctly with no selected genes and export ability', () => {
    const store = mockStore(initialState);

    const component = mount(
      <Provider store={store}>
        <SelectionActions experimentId='test' />
      </Provider>,
    );

    const button = component.find(Button);
    const text = component.find(Text);

    // There should be no buttons.
    expect(button.length).toEqual(0);

    // No selection text should show.
    expect(text.length).toEqual(0);
  });

  test('renders correctly with selected genes and export ability', () => {
    const state = _.cloneDeep(initialState);
    state.genes.selected = ['CEMIP', 'TIMP3'];

    const store = mockStore(state);
    const component = mount(
      <Provider store={store}>
        <SelectionActions experimentId='test' />
      </Provider>,
    );
    const button = component.find(Button);
    const text = component.find(Text);

    // There should be six buttons.
    expect(button.length).toEqual(4);

    // A clear button
    expect(button.at(0).childAt(0).text()).toEqual('Clear');

    // And a copy to clipboard button
    expect(button.at(1).childAt(0).text()).toEqual('Copy');

    // A list button
    expect(button.at(2).childAt(0).text()).toEqual('List');

    // And a Heatmap button
    expect(button.at(3).childAt(0).text()).toEqual('Heatmap');

    // The text should be loaded.
    expect(text.length).toEqual(1);
    expect(text.childAt(0).text()).toEqual('2 genes selected');
  });

  test('List selected button changes from list to hide and back correctly', () => {
    const state = _.cloneDeep(initialState);
    state.genes.selected = ['CEMIP', 'TIMP3'];

    const store = mockStore(state);
    const mockOnListSelected = jest.fn();
    const component = mount(
      <Provider store={store}>
        <SelectionActions
          experimentId='test'
          onListSelected={mockOnListSelected}
        />
      </Provider>,
    );
    const listSelectedButton = component.find(Button).at(2);
    expect(listSelectedButton.childAt(0).text()).toEqual('List');

    // click "List"
    listSelectedButton.simulate('click');
    component.update();

    expect(mockOnListSelected.mock.calls.length).toEqual(1);
    expect(mockOnListSelected.mock.calls[0]).toEqual([true]);
    expect(listSelectedButton.childAt(0).text()).toEqual('Hide');

    // click "Hide"
    listSelectedButton.simulate('click');
    component.update();

    expect(mockOnListSelected.mock.calls.length).toEqual(2);
    expect(mockOnListSelected.mock.calls[1]).toEqual([false]);
    expect(listSelectedButton.childAt(0).text()).toEqual('List');
  });

  test('Shows extraOptions', () => {
    const state = _.cloneDeep(initialState);
    state.genes.selected = ['CEMIP', 'TIMP3'];

    const store = mockStore(state);
    const component = mount(
      <Provider store={store}>
        <SelectionActions
          experimentId='test'
          extraOptions={<div id='testExtraOption' />}
        />
      </Provider>,
    );

    expect(component.find('#testExtraOption').length).toEqual(1);
  });
});
