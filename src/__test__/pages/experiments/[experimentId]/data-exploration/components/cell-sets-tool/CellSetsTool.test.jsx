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
      cellSets: {
        error: false,
        hierarchy: [
          { key: 'louvain-0' },
          { key: 'louvain-1' },
          { key: 'e8231d51-8e63-4fbc-b32f-e2a9902adfd3' },
        ],
        loading: false,
        properties: {
          'louvain-0': {
            cellIds: (['764', '30', '1058', '683', '621', '722', '103', '206']),
            color: '#c9080a',
            name: 'test',
            rootNode: undefined,
          },
          'louvain-1': {
            cellIds: ([0, 21, 29, 31, 34, 55, 58, 61, 67, 69, 70, 72, 73]),
            color: '#e377c2',
            name: 'Cluster 0',
            rootNode: undefined,
          },
          'e8231d51-8e63-4fbc-b32f-e2a9902adfd3': {
            cellIds: ([0, 21, 29, 31, 34, 55, 58, 61, 67, 69, 70, 72, 73]),
            key: 'e8231d51-8e63-4fbc-b32f-e2a9902adfd3',
            name: 'New Cluster',
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
