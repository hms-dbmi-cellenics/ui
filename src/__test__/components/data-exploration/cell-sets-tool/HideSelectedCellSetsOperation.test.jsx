import React from 'react';
import { mount } from 'enzyme';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import { CELL_SETS_HIDE, CELL_SETS_UNHIDE } from 'redux/actionTypes/cellSets';
import initialState from 'redux/reducers/cellSets/initialState';
import HideSelectedCellSetsOperation from 'components/data-exploration/cell-sets-tool/HideSelectedCellSetsOperation';
import '__test__/test-utils/setupTests';

const mockStore = configureMockStore([thunk]);

const HIDDEN_KEY_1 = 'hidden-key-1';
const HIDDEN_KEY_2 = 'hidden-key-2';
const VISIBLE_KEY = 'visible-key';

describe('HideSelectedCellSetsOperation', () => {
  test('renders correctly', () => {
    const store = mockStore({
      cellSets: {
        ...initialState,
        hidden: new Set([HIDDEN_KEY_1, HIDDEN_KEY_2]),
      },
    });

    const component = mount(
      <Provider store={store}>
        <HideSelectedCellSetsOperation selectedCellSetKeys={[VISIBLE_KEY]} />
      </Provider>,
    );

    const tooltip = component.find('Tooltip');
    expect(tooltip.length).toEqual(1);

    const button = component.find('Tooltip Button');
    expect(button.length).toEqual(1);
  });

  test('renders hide icon and tooltip when selected cell sets are not hidden', () => {
    const store = mockStore({
      cellSets: {
        ...initialState,
        hidden: new Set([HIDDEN_KEY_1, HIDDEN_KEY_2]),
      },
    });

    const component = mount(
      <Provider store={store}>
        <HideSelectedCellSetsOperation selectedCellSetKeys={[VISIBLE_KEY]} />
      </Provider>,
    );

    const tooltip = component.find('Tooltip');
    expect(tooltip.props().title).toContain('Hide selected cell sets');

    const button = component.find('Button');
    expect(button.props()['aria-label']).toContain('Hide selected cell sets');
  });

  test('renders show icon and tooltip when all selected cell sets are hidden', () => {
    const store = mockStore({
      cellSets: {
        ...initialState,
        hidden: new Set([HIDDEN_KEY_1, HIDDEN_KEY_2]),
      },
    });

    const component = mount(
      <Provider store={store}>
        <HideSelectedCellSetsOperation selectedCellSetKeys={[HIDDEN_KEY_1, HIDDEN_KEY_2]} />
      </Provider>,
    );

    const tooltip = component.find('Tooltip');
    expect(tooltip.props().title).toContain('Show selected cell sets');

    const button = component.find('Button');
    expect(button.props()['aria-label']).toContain('Show selected cell sets');
  });

  test('renders hide icon and tooltip when only some selected cell sets are hidden', () => {
    const store = mockStore({
      cellSets: {
        ...initialState,
        hidden: new Set([HIDDEN_KEY_1, HIDDEN_KEY_2]),
      },
    });

    const component = mount(
      <Provider store={store}>
        <HideSelectedCellSetsOperation selectedCellSetKeys={[HIDDEN_KEY_1, VISIBLE_KEY]} />
      </Provider>,
    );

    const tooltip = component.find('Tooltip');
    expect(tooltip.props().title).toContain('Hide selected cell sets');

    const button = component.find('Button');
    expect(button.props()['aria-label']).toContain('Hide selected cell sets');
  });

  test('clicking button when all visible dispatches hide actions for all selected sets', () => {
    const store = mockStore({
      cellSets: {
        ...initialState,
        hidden: new Set([HIDDEN_KEY_1, HIDDEN_KEY_2]),
      },
    });

    const component = mount(
      <Provider store={store}>
        <HideSelectedCellSetsOperation selectedCellSetKeys={[VISIBLE_KEY, 'another-visible']} />
      </Provider>,
    );

    const button = component.find('Button');
    button.simulate('click');

    expect(store.getActions().length).toEqual(2);

    const action1 = store.getActions()[0];
    expect(action1.type).toBe(CELL_SETS_HIDE);

    const action2 = store.getActions()[1];
    expect(action2.type).toBe(CELL_SETS_HIDE);
  });

  test('clicking button when all hidden dispatches unhide actions for all selected sets', () => {
    const store = mockStore({
      cellSets: {
        ...initialState,
        hidden: new Set([HIDDEN_KEY_1, HIDDEN_KEY_2]),
      },
    });

    const component = mount(
      <Provider store={store}>
        <HideSelectedCellSetsOperation selectedCellSetKeys={[HIDDEN_KEY_1, HIDDEN_KEY_2]} />
      </Provider>,
    );

    const button = component.find('Button');
    button.simulate('click');

    expect(store.getActions().length).toEqual(2);

    const action1 = store.getActions()[0];
    expect(action1.type).toBe(CELL_SETS_UNHIDE);

    const action2 = store.getActions()[1];
    expect(action2.type).toBe(CELL_SETS_UNHIDE);
  });

  test('clicking button when partially hidden dispatches hide and unhide actions', () => {
    const store = mockStore({
      cellSets: {
        ...initialState,
        hidden: new Set([HIDDEN_KEY_1, HIDDEN_KEY_2]),
      },
    });

    const component = mount(
      <Provider store={store}>
        <HideSelectedCellSetsOperation selectedCellSetKeys={[HIDDEN_KEY_1, VISIBLE_KEY]} />
      </Provider>,
    );

    const button = component.find('Button');
    button.simulate('click');

    expect(store.getActions().length).toEqual(2);

    // First action for HIDDEN_KEY_1 (was hidden, should unhide)
    const action1 = store.getActions()[0];
    expect(action1.type).toBe(CELL_SETS_UNHIDE);

    // Second action for VISIBLE_KEY (was visible, should hide)
    const action2 = store.getActions()[1];
    expect(action2.type).toBe(CELL_SETS_HIDE);
  });
});
