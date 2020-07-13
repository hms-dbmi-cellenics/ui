import React from 'react';
import { Provider } from 'react-redux';
import { mount, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import CrossHair from '../../../../../pages/data-exploration/components/cross-hair/CrossHair';

const mockStore = configureMockStore([thunk]);

describe('CrossHair', () => {
  configure({ adapter: new Adapter() });
  test('renders correctly when hovered over different component', () => {
    const store = mockStore({
      cellInfo: {
        cellName: 1904,
        componentType: 'heatmap',
        expression: 0,
        geneName: 'DOK3',
      },
    });

    const mockGetView = jest.fn(() => ({
      x: 100,
      y: 200,
      width: 500,
      height: 500,
    }));

    const component = mount(
      <Provider store={store}>
        <CrossHair componentType='umap' getView={mockGetView} />
      </Provider>,
    );

    expect(component.find('div').length).toEqual(2);
    expect(mockGetView).toBeCalledTimes(1);
  });

  test('does not render when hovered over the same component', () => {
    const store = mockStore({
      cellInfo: {
        cellName: 1904,
        componentType: 'umap',
        expression: 0,
        geneName: 'DOK3',
      },
    });

    const mockGetView = jest.fn(() => ({
      x: 100,
      y: 200,
      width: 500,
      height: 500,
    }));

    const component = mount(
      <Provider store={store}>
        <CrossHair componentType='umap' getView={mockGetView} />
      </Provider>,
    );

    expect(component.find('div').length).toEqual(0);
    expect(mockGetView).toBeCalledTimes(0);
  });

  test('does not render when there is no cell information', () => {
    const store = mockStore({
      cellInfo: {},
    });

    const mockGetView = jest.fn(() => ({
      x: 100,
      y: 200,
      width: 500,
      height: 500,
    }));

    const component = mount(
      <Provider store={store}>
        <CrossHair componentType='umap' getView={mockGetView} />
      </Provider>,
    );

    expect(component.find('div').length).toEqual(0);
    expect(mockGetView).toBeCalledTimes(0);
  });
});
