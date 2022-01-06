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
        <SelectionActions
          experimentId='test'
        />
      </Provider>,
    );
    const text = component.find(Text);

    // There should be no text loaded.
    expect(text.length).toEqual(0);
  });

  test('renders correctly with selected genes ', () => {
    const state = _.cloneDeep(initialState);
    state.genes.selected = ['CEMIP'];

    const store = mockStore(state);
    const component = mount(
      <Provider store={store}>
        <SelectionActions
          experimentId='test'
        />
      </Provider>,
    );
    const button = component.find(Button);
    const text = component.find(Text);
    // There should be two buttons.
    expect(button.length).toEqual(5);

    // A clear button
    expect(button.at(0).childAt(0).text()).toEqual('Clear');

    // And a copy to clipboard button
    expect(button.at(1).childAt(0).text()).toEqual('Copy');

    // And a list selected button
    expect(button.at(2).childAt(0).text()).toEqual('List');

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
        <SelectionActions
          experimentId='test'
          showCSV={false}
        />
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
        <SelectionActions
          experimentId='test'
          showCSV
          onExportCSV={() => null}
        />
      </Provider>,
    );

    const button = component.find(Button);
    const text = component.find(Text);

    // There should be two buttons.
    expect(button.length).toEqual(2);

    // An 'export as csv...' button
    expect(button.at(0).childAt(0).text()).toEqual('Export as CSV ...');
    expect(button.at(1).childAt(0).text()).toEqual('Pathway analysis');

    // No selection text should show.
    expect(text.length).toEqual(0);
  });

  test('callback is called when export button is pressed', () => {
    const store = mockStore(initialState);
    const mockCallback = jest.fn();

    const component = mount(
      <Provider store={store}>
        <SelectionActions
          experimentId='test'
          showCSV
          onExportCSV={mockCallback}
        />
      </Provider>,
    );

    const buttons = component.find(Button);

    // There should be one button.
    expect(buttons.length).toEqual(2);

    buttons.at(0).simulate('click');
    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  test('renders correctly with selected genes and export ability', () => {
    const state = _.cloneDeep(initialState);
    state.genes.selected = ['CEMIP', 'TIMP3'];

    const store = mockStore(state);
    const component = mount(
      <Provider store={store}>
        <SelectionActions
          experimentId='test'
          showCSV
        />
      </Provider>,
    );
    const button = component.find(Button);
    const text = component.find(Text);

    // There should be four buttons.
    expect(button.length).toEqual(5);

    // A clear button
    expect(button.at(0).childAt(0).text()).toEqual('Clear');

    // And a copy to clipboard button
    expect(button.at(1).childAt(0).text()).toEqual('Copy');

    // And a list button
    expect(button.at(2).childAt(0).text()).toEqual('List');

    // And an export button
    expect(button.at(3).childAt(0).text()).toEqual('Export as CSV ...');

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
          showCSV
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
});
