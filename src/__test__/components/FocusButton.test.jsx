import React from 'react';
import Enzyme, { mount } from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { CELL_INFO_FOCUS, CELL_INFO_UNFOCUS } from 'redux/actionTypes/cellInfo';
import FocusButton from 'components/FocusButton';
import '__test__/test-utils/setupTests';

Enzyme.configure({ adapter: new Adapter() });

const eventStub = {
  stopPropagation: () => { },
};

const mockStore = configureMockStore([thunk]);

const FOCUSED_KEY = 'some-key-we-defined';
const FOCUSED_STORE = 'some-random-store';

const store = mockStore({
  cellInfo: {
    focus: {
      key: FOCUSED_KEY,
      store: FOCUSED_STORE,
    },
  },
});

describe('FocusButton', () => {
  test('renders correctly', () => {
    const component = mount(
      <Provider store={store}>
        <FocusButton
          store='some_store'
          lookupKey='some_key'
          experimentId='a'
        />
      </Provider>,
    );

    const tooltip = component.find('Tooltip');
    expect(tooltip.length).toEqual(1);

    const button = component.find('Tooltip Button');
    expect(button.length).toEqual(1);
  });

  test('renders correctly when unfocused', () => {
    const component = mount(
      <Provider store={store}>
        <FocusButton
          store='not-focused-store'
          lookupKey='not-focused-key'
          experimentId='a'
        />
      </Provider>,
    );

    const focusButtonTooltip = component.find('Tooltip');
    expect(focusButtonTooltip.props().title).toContain('Show');
  });

  test('renders correctly when focused', () => {
    const component = mount(
      <Provider store={store}>
        <FocusButton
          store={FOCUSED_STORE}
          lookupKey={FOCUSED_KEY}
          experimentId='a'
        />
      </Provider>,
    );

    const focusButtonTooltip = component.find('Tooltip');
    expect(focusButtonTooltip.props().title).toContain('Hide');
  });

  test('clicking on focused button triggers unfocus action', () => {
    const component = mount(
      <Provider store={store}>
        <FocusButton
          store={FOCUSED_STORE}
          lookupKey={FOCUSED_KEY}
          experimentId='a'
        />
      </Provider>,
    );

    const button = component.find('Button');

    button.simulate('click', eventStub);

    expect(store.getActions().length).toEqual(1);

    const action = store.getActions()[0];
    expect(action.type).toBe(CELL_INFO_UNFOCUS);
    expect(action).toMatchSnapshot();
  });

  test('clicking on unfocused button triggers focus action', () => {
    const component = mount(
      <Provider store={store}>
        <FocusButton
          store='new-store'
          lookupKey='new-key'
          experimentId='a'
        />
      </Provider>,
    );

    const button = component.find('Button');

    button.simulate('click', eventStub);

    expect(store.getActions().length).toEqual(2);

    const action = store.getActions()[1];
    expect(action.type).toBe(CELL_INFO_FOCUS);
    expect(action).toMatchSnapshot();
  });
});
