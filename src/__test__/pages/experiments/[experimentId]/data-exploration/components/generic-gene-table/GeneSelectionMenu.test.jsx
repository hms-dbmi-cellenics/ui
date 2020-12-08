import React from 'react';
import { mount, shallow, configure } from 'enzyme';
import { Provider } from 'react-redux';
import Adapter from 'enzyme-adapter-react-16';
import thunk from 'redux-thunk';
import preloadAll from 'jest-next-dynamic';
import configureMockStore from 'redux-mock-store';
import { Select } from 'antd';
import GeneSelectionMenu from '../../../../../../../pages/experiments/[experimentId]/data-exploration/components/generic-gene-table/GeneSelectionMenu';
import SelectionActions from '../../../../../../../pages/experiments/[experimentId]/data-exploration/components/generic-gene-table/SelectionActions';

const mockStore = configureMockStore([thunk]);
configure({ adapter: new Adapter() });

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

    console.log('LALALALALAL');
    expect(component.find(Select).length).toEqual(0);

    // click "List"
    component.find(SelectionActions).props().onListSelected(true);
    component.update();

    expect(component.find(Select).length).toEqual(1);
    expect(component.find(Select).props().value).toEqual(['A', 'B', 'C']);
  });
});
