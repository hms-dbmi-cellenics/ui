import React from 'react';
import { mount } from 'enzyme';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';
import preloadAll from 'jest-next-dynamic';
import configureMockStore from 'redux-mock-store';
import { Select } from 'antd';
import { act } from 'react-dom/test-utils';
import GeneSelectionMenu from 'components/data-exploration/generic-gene-table/GeneSelectionMenu';
import SelectionActions from 'components/data-exploration/generic-gene-table/SelectionActions';

const mockStore = configureMockStore([thunk]);

let component;
const experimentId = '1234';
const initialState = {
  genes: {
    selected: ['A', 'B', 'C'],
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

  it('Renders correctly when there are no selected genes and user has not clicked list', () => {
    const store = mockStore(initialState);

    component = mount(
      <Provider store={store}>
        <GeneSelectionMenu experimentId={experimentId} />
      </Provider>,
    );

    expect(component.find(Select).length).toEqual(0);
  });

  it('Renders correctly when there are selected genes and user clicks list', () => {
    const store = mockStore(initialState);

    component = mount(
      <Provider store={store}>
        <GeneSelectionMenu experimentId={experimentId} />
      </Provider>,
    );

    expect(component.find(Select).length).toEqual(0);

    // click "List"
    act(() => { component.find(SelectionActions).props().onListSelected(true); });
    component.update();

    expect(component.find(Select).length).toEqual(1);
    expect(component.find(Select).props().value).toEqual(['A', 'B', 'C']);
  });
});
