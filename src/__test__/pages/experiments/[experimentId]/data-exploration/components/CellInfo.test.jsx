import React from 'react';
import { Provider } from 'react-redux';
import { mount, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { Card } from 'antd';
import CellInfo from '../../../../../../pages/experiments/[experimentId]/data-exploration/components/CellInfo';

const mockStore = configureMockStore([thunk]);

describe('CellInfo', () => {
  configure({ adapter: new Adapter() });
  test('renders correctly when hovering over the same component', () => {
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
        <CellInfo componentType='heatmap' coordinates={coordinates} />
      </Provider>,
    );

    expect(component.find(Card).length).toEqual(1);
  });

  test('does not show when hovering over different component', () => {
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
        <CellInfo componentType='umap' coordinates={coordinates} />
      </Provider>,
    );

    expect(component.find(Card).length).toEqual(0);
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
        <CellInfo componentType='heatmap' coordinates={coordinates} />
      </Provider>,
    );

    expect(component.find(Card).length).toEqual(0);
  });
});
