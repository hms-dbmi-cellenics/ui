import React from 'react';
import { Provider } from 'react-redux';
import { mount, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { Button } from 'antd';
import CellSetsTool from '../../../../../../../pages/experiments/[experimentId]/data-exploration/components/cell-sets-tool/CellSetsTool';

const mockStore = configureMockStore([thunk]);

describe('cell sets tool', () => {
  configure({ adapter: new Adapter() });
  test('Check that delete button is not present for louvain', () => {
    const experimentId = '1234';
    const height = 500;
    const width = 500;
    debugger;
    const store = mockStore({
      cellSets: {
        error: false,
        hierarchy: {
          0: {
            0: { key: 'louvain-0' },
            key: 'louvain',
          },
        },
      },
    });
    const component = mount(
      <Provider store={store}>
        <CellSetsTool
          experimentId={experimentId}
          width={width}
          height={height}
        />
      </Provider>,
    );
    expect(component.find(Button).length).toEqual(0);
  });
  test('Delete option is available for not louvain clusters', () => {
    const experimentId = '1234';
    const height = 500;
    const width = 500;
    const store = mockStore({
      cellSets: {
        error: false,
        hierarchy: {
          0: {
            0: { key: 'louvain-0' },
            key: 'louvain',
          },
          1: {
            0: { key: '93f92520-af56-409e-8bd4-3f1db111aa07' },
          },
        },
      },
    });
    const component = mount(
      <Provider store={store}>
        <CellSetsTool
          experimentId={experimentId}
          width={width}
          height={height}
        />
      </Provider>,
    );
    expect(component.find(Button).length).toEqual(1);
  });
});
