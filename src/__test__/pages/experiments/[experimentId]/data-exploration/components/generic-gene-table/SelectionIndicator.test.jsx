import React from 'react';
import { mount, configure } from 'enzyme';
import _ from 'lodash';
import Adapter from 'enzyme-adapter-react-16';
import preloadAll from 'jest-next-dynamic';
import { Button, Typography } from 'antd';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';
import configureMockStore from 'redux-mock-store';
import SelectionIndicator from '../../../../../../../pages/experiments/[experimentId]/data-exploration/components/generic-gene-table/SelectionIndicator';
import { GENES_DESELECT } from '../../../../../../../redux/actionTypes/genes';

const { Text } = Typography;

jest.mock('localforage');

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
    },
    selected: [],
    focused: undefined,
  },
};

const mockStore = configureMockStore([thunk]);

describe('SelectionIndicator', () => {
  beforeAll(async () => {
    await preloadAll();
  });

  test('renders correctly with no selected genes and no export ability', () => {
    const store = mockStore(initialState);
    const component = mount(
      <Provider store={store}>
        <SelectionIndicator
          experimentId='test'
          showCSV={false}
        />
      </Provider>,
    );
    const button = component.find(Button);
    const text = component.find(Text);

    // There should be no button loaded.
    expect(button.length).toEqual(0);

    // There should be no text loaded.
    expect(text.length).toEqual(0);
  });

  test('renders correctly with selected genes and no export ability', () => {
    const state = _.cloneDeep(initialState);
    state.genes.selected = ['CEMIP'];

    const store = mockStore(state);
    const component = mount(
      <Provider store={store}>
        <SelectionIndicator
          experimentId='test'
          showCSV={false}
        />
      </Provider>,
    );
    const button = component.find(Button);
    const text = component.find(Text);

    // There should be two buttons.
    expect(button.length).toEqual(2);

    // A clear button
    expect(button.at(0).childAt(0).text()).toEqual('Clear');

    // And a copy to clipboard button
    expect(button.at(1).childAt(0).text()).toEqual('Copy selected');

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
        <SelectionIndicator
          experimentId='test'
          showCSV={false}
        />
      </Provider>,
    );
    const button = component.find(Button);

    button.at(0).simulate('click');
    const firstAction = store.getActions()[0];
    expect(firstAction.type).toEqual(GENES_DESELECT);
    expect(firstAction).toMatchSnapshot();
  });

  test('renders correctly with no selected genes and export ability', () => {
    const store = mockStore(initialState);

    const component = mount(
      <Provider store={store}>
        <SelectionIndicator
          experimentId='test'
          showCSV
          onExportCSV={() => null}
        />
      </Provider>,
    );

    const button = component.find(Button);
    const text = component.find(Text);

    // There should be one button.
    expect(button.length).toEqual(1);

    // An 'export as csv...' button
    expect(button.at(0).childAt(0).text()).toEqual('Export as CSV...');

    // No selection text should show.
    expect(text.length).toEqual(0);
  });

  test('callback is called when export button is pressed', () => {
    const store = mockStore(initialState);
    const mockCallback = jest.fn();

    const component = mount(
      <Provider store={store}>
        <SelectionIndicator
          experimentId='test'
          showCSV
          onExportCSV={mockCallback}
        />
      </Provider>,
    );

    const button = component.find(Button);

    // There should be one button.
    expect(button.length).toEqual(1);

    button.simulate('click');
    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  test('renders correctly with selected genes and export ability', () => {
    const state = _.cloneDeep(initialState);
    state.genes.selected = ['CEMIP', 'TIMP3'];

    const store = mockStore(state);
    const component = mount(
      <Provider store={store}>
        <SelectionIndicator
          experimentId='test'
          showCSV
        />
      </Provider>,
    );
    const button = component.find(Button);
    const text = component.find(Text);

    // There should be three buttons.
    expect(button.length).toEqual(3);

    // A clear button
    expect(button.at(0).childAt(0).text()).toEqual('Clear');

    // And a copy to clipboard button
    expect(button.at(1).childAt(0).text()).toEqual('Copy selected');

    // And an export button
    expect(button.at(2).childAt(0).text()).toEqual('Export as CSV...');

    // The text should be loaded.
    expect(text.length).toEqual(1);
    expect(text.childAt(0).text()).toEqual('2 genes selected');
  });


  configure({ adapter: new Adapter() });
});
