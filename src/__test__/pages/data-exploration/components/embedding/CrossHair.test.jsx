import React from 'react';
import { Provider } from 'react-redux';
import { mount, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import CrossHair from '../../../../../pages/data-exploration/components/embedding/CrossHair';

const mockStore = configureMockStore([thunk]);

describe('CrossHair', () => {
  configure({ adapter: new Adapter() });
  test('renders correctly', () => {
    const store = mockStore({
      cellInfo: {
        cellName: 1904,
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
