import React from 'react';
import { Provider } from 'react-redux';
import { mount, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import {
  DeleteOutlined,
} from '@ant-design/icons';
import CellSetsTool from '../../../../../../../pages/experiments/[experimentId]/data-exploration/components/cell-sets-tool/CellSetsTool';

const experimentId = '1234';
const mockStore = configureMockStore([thunk]);

describe('cell sets tool', () => {
  configure({ adapter: new Adapter() });
  test('Check that delete button is not present for louvain', () => {
    const fakeStore = mockStore({
      cellSets: {
        error: false,
        hierarchy: [
          { key: 'louvain-0' },
          { key: 'louvain-1' },
        ],
        loading: false,
        properties: {
          'louvain-0': {
            cellIds: ['764', '30', '1058', '683', '621', '722', '103', '206'],
            color: '#c9080a',
            name: 'test',
            rootNode: undefined,
          },
          'louvain-1': {
            cellIds: [0, 21, 29, 31, 34, 55, 58, 61, 67, 69, 70, 72, 73],
            color: '#e377c2',
            name: 'Cluster 0',
            rootNode: undefined,
          },
        },
      },
    });
    const component = mount(
      <Provider store={fakeStore}>
        <CellSetsTool
          experimentId={experimentId}
          width={500}
          height={500}
        />
      </Provider>,

    );
    expect(component.find(DeleteOutlined).length).toEqual(0);
  });
  test('Delete option is available for not louvain clusters', () => {
    const store = mockStore({
      cellInfo: {
        cellName: 74,
        componentType: 'heatmap',
        expression: 1.0431824837287789,
        focus: { store: null, key: null },
        geneName: 'FTH1',
      },
      cellSets: {
        error: false,
        hierarchy: [
          {
            key: 'louvain',
            children: [{ key: 'louvain-0' }, { key: 'louvain-1' }],
          },
          {
            key: 'condition',
            children: [
              { key: 'condition-control' },
              { key: 'condition-treated' },
            ],
          },
          {
            key: 'scratchpad',
            children: [{ key: '36cf4faf-2086-44b8-bf60-a74eadf67330' }],
          },
        ],
        loading: false,
        properties: {
          louvain: {
            cellIds: [],
            type: 'cellSets',
            rootNode: true,
          },
          'louvain-0': {
            cellIds: ['764', '30', '1058', '683', '621', '722', '103', '206'],
            color: '#c9080a',
            name: 'test',
            rootNode: undefined,
            type: undefined,
          },
          'louvain-1': {
            cellIds: (['764', '30', '1058', '683', '621', '722', '103', '206']),
            color: '#e377c2',
            name: 'Cluster 0',
            rootNode: undefined,
            type: undefined,
          },
          scratchpad: {
            cellIds: [],
            rootNode: true,
            name: 'Scratchpad',
            type: 'cellSets',
          },
          '36cf4faf-2086-44b8-bf60-a74eadf67330': {
            cellIds: (['764', '30', '1058', '683', '621', '722', '103', '206']),
            key: '36cf4faf-2086-44b8-bf60-a74eadf67330',
            name: 'New Cluster',
          },

          condition: {
            cellIds: [],
            name: 'Condition',
            rootNode: true,
            type: 'metadataCategorical',
          },
          'condition-control': {
            cellIds: (['764', '30', '1058', '683', '621', '722', '103', '206']),
            name: 'Control',
          },
          'condition-treated': {
            cellIds: (['764', '30', '1058', '683', '621', '722', '103', '206']),
            name: 'Treated',
          },
        },
      },
    });
    const component = mount(
      <Provider store={store}>
        <CellSetsTool
          experimentId={experimentId}
          width={500}
          height={500}
        />
      </Provider>,

    );
    expect(component.find(DeleteOutlined).length).toEqual(1);
  });
});
