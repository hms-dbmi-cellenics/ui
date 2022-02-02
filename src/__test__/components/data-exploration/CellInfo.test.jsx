import React from 'react';
import { mount } from 'enzyme';
import { Card } from 'antd';
import CellInfo from '../../../components/data-exploration/CellInfo';
import '__test__/test-utils/setupTests';

const cellInfo = {
  cellName: 1904,
  componentType: 'heatmap',
  expression: 0,
  geneName: 'DOK3',
};

describe('CellInfo', () => {
  test('renders correctly when hovering over the same component', () => {
    const coordinates = {
      x: 100,
      y: 200,
      width: 500,
      height: 500,
    };

    const component = mount(
      <CellInfo componentType='heatmap' coordinates={coordinates} cellInfoRef={cellInfo} />,
    );

    expect(component.find(Card).length).toEqual(1);
  });

  test('does not show when hovering over different component', () => {
    const coordinates = {
      x: 100,
      y: 200,
      width: 500,
      height: 500,
    };

    const component = mount(
      <CellInfo componentType='umap' coordinates={coordinates} cellInfoRef={cellInfo} />,
    );

    expect(component.find(Card).length).toEqual(0);
  });

  test('does not render when there is no cell information', () => {
    const coordinates = {
      current: {
        x: 100,
        y: 200,
        width: 500,
        height: 500,
      },
    };

    const component = mount(
      <CellInfo componentType='heatmap' coordinates={coordinates} cellInfoRef={{}} />,
    );

    expect(component.find(Card).length).toEqual(0);
  });
});
