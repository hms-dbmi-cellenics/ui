import React from 'react';
import { Provider } from 'react-redux';
import { mount } from 'enzyme';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import CrossHair from 'components/data-exploration/embedding/CrossHair';

const mockStore = configureMockStore([thunk]);

describe('CrossHair', () => {
  test('renders correctly', () => {
    const store = mockStore({
      cellInfo: {
        cellId: 1904,
        componentType: 'heatmap',
        expression: 0,
        geneName: 'DOK3',
      },
    });

    const coordinates = {
      current: {
        x: 100,
        y: 200,
        width: 500,
        height: 500,
      },
    };

    const component = mount(
      <Provider store={store}>
        <CrossHair coordinates={coordinates} />
      </Provider>,
    );

    expect(component.find('div').length).toEqual(3);
  });

  test('does not render when there is no cell information', () => {
    const store = mockStore({
      cellInfo: {},
    });

    const coordinates = {
      current: {
        x: 100,
        y: 200,
        width: 500,
        height: 500,
      },
    };

    const component = mount(
      <Provider store={store}>
        <CrossHair coordinates={coordinates} />
      </Provider>,
    );

    expect(component.find('div').length).toEqual(0);
  });
});
