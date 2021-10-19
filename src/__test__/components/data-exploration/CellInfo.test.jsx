import React from 'react';
import { Provider } from 'react-redux';
import { mount } from 'enzyme';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { Card } from 'antd';
import CellInfo from '../../../components/data-exploration/CellInfo';
import '__test__/test-utils/setupTests';

const mockStore = configureMockStore([thunk]);

describe('CellInfo', () => {
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
