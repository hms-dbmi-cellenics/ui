import React from 'react';
import { mount } from 'enzyme';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import { CELL_SETS_HIDE, CELL_SETS_UNHIDE } from 'redux/actionTypes/cellSets';
import initialState from 'redux/reducers/cellSets/initialState';
import HideButton from 'components/data-exploration/cell-sets-tool/HideButton';

const eventStub = {
  stopPropagation: () => { },
};

const mockStore = configureMockStore([thunk]);

const HIDDEN_KEY = 'random-hidden-key';
const store = mockStore({
  cellSets: {
    ...initialState,
    hidden: new Set([HIDDEN_KEY]),
  },
});

describe('HideButton', () => {
  test('renders correctly', () => {
    const component = mount(
      <Provider store={store}>
        <HideButton cellSetKey='not-hidden' />
      </Provider>,
    );

    const tooltip = component.find('Tooltip');
    expect(tooltip.length).toEqual(1);

    const button = component.find('Tooltip Button');
    expect(button.length).toEqual(1);
  });

  test('renders correctly when not hidden', () => {
    const component = mount(
      <Provider store={store}>
        <HideButton cellSetKey='not-hidden' />
      </Provider>,
    );

    const focusButtonTooltip = component.find('Tooltip');
    expect(focusButtonTooltip.props().title).toContain('Hide');
  });

  test('renders correctly when hidden', () => {
    const component = mount(
      <Provider store={store}>
        <HideButton cellSetKey={HIDDEN_KEY} />
      </Provider>,
    );

    const focusButtonTooltip = component.find('Tooltip');
    expect(focusButtonTooltip.props().title).toContain('Unhide');
  });

  test('clicking on hidden state triggers unhide action', () => {
    const component = mount(
      <Provider store={store}>
        <HideButton cellSetKey={HIDDEN_KEY} />
      </Provider>,
    );

    const button = component.find('Button');

    button.simulate('click', eventStub);

    expect(store.getActions().length).toEqual(1);

    const action = store.getActions()[0];
    expect(action.type).toBe(CELL_SETS_UNHIDE);
    expect(action).toMatchSnapshot();
  });

  test('clicking on visible state triggers hide acction', () => {
    const component = mount(
      <Provider store={store}>
        <HideButton cellSetKey='not-hidden' />
      </Provider>,
    );

    const button = component.find('Button');

    button.simulate('click', eventStub);

    expect(store.getActions().length).toEqual(2);

    const action = store.getActions()[1];
    expect(action.type).toBe(CELL_SETS_HIDE);
    expect(action).toMatchSnapshot();
  });
});
