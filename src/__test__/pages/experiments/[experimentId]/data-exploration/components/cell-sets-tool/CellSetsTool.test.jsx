import React from 'react';
import { Tabs } from 'antd';
import { mount, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import preloadAll from 'jest-next-dynamic';
import { Provider } from 'react-redux';
import {
  DeleteOutlined,
} from '@ant-design/icons';
import CellSetsTool from '../../../../../../../pages/experiments/[experimentId]/data-exploration/components/cell-sets-tool/CellSetsTool';
import CellSetOperation from '../../../../../../../pages/experiments/[experimentId]/data-exploration/components/cell-sets-tool/CellSetOperation';

const { TabPane } = Tabs;

jest.mock('localforage');

const mockStore = configureStore([thunk]);

describe('CellSetsTool', () => {
  const storeState = {
    cellInfo: {
      focus: { store: null, key: null },
    },
    cellSets: {
      loading: false,
      error: false,
      selected: [],
      properties: {
        'cluster-a': {
          name: 'cluster a',
          key: 'cluster-a',
          cellIds: new Set(['1', '2']),
          color: '#00FF00',
        },
        'cluster-b': {
          name: 'cluster b',
          key: 'cluster-b',
          cellIds: new Set(['2', '3', '4', '5']),
          color: '#FF0000',
        },
        'cluster-c': {
          name: 'cluster c',
          key: 'cluster-c',
          cellIds: new Set(['2', '5']),
          color: '#0000FF',
        },
        'scratchpad-a': {
          cellIds: new Set(['3']),
          key: 'scratchpad-a',
          name: 'New Cluster',
          color: '#ff00ff',
        },
        louvain: {
          cellIds: new Set(),
          name: 'Louvain clusters',
          key: 'louvain',
          type: 'cellSets',
          rootNode: true,
        },
        scratchpad: {
          cellIds: new Set(),
          name: 'Custom selections',
          key: 'scratchpad',
          type: 'cellSets',
          rootNode: true,
        },
      },
      hierarchy: [
        {
          key: 'louvain',
          children: [{ key: 'cluster-a' }, { key: 'cluster-b' }, { key: 'cluster-c' }],
        },
        {
          key: 'scratchpad',
          children: [{ key: 'scratchpad-a' }],
        },
      ],
      hidden: new Set(),
    },
  };

  configure({ adapter: new Adapter() });

  beforeAll(async () => {
    await preloadAll();
  });

  it('renders correctly', () => {
    const store = mockStore(storeState);

    const component = mount(
      <Provider store={store}>
        <CellSetsTool
          experimentId='1234'
          width={50}
          height={50}
        />
      </Provider>,
    );

    const tabs = component.find(Tabs);

    // There should be one tab container.
    expect(tabs.length).toEqual(1);

    // It should have two panes.
    expect(tabs.find(TabPane).length).toEqual(2);

    // There should be one delete button for the scratchpad cluster.
    expect(component.find(DeleteOutlined).length).toEqual(1);
  });

  it('cell set operations should not render when no cell sets are selected', () => {
    const store = mockStore(storeState);

    const component = mount(
      <Provider store={store}>
        <CellSetsTool
          experimentId='1234'
          width={50}
          height={50}
        />
      </Provider>,
    );

    const operations = component.find(CellSetOperation);

    // There should be no operations rendered
    expect(operations.length).toEqual(0);
  });

  it('cell set operations should render when cell sets are selected', () => {
    const store = mockStore(
      {
        ...storeState,
        cellSets: {
          ...storeState.cellSets,
          selected: [...storeState.cellSets.selected, 'cluster-a'],
        },
      },
    );

    const component = mount(
      <Provider store={store}>
        <CellSetsTool
          experimentId='1234'
          width={50}
          height={50}
        />
      </Provider>,
    );

    const operations = component.find(CellSetOperation);

    // There should be three operations rendered (union, intersection, complement)
    expect(operations.length).toEqual(3);
  });

  it('cell set operations should work appropriately for unions', () => {
    const store = mockStore(
      {
        ...storeState,
        cellSets: {
          ...storeState.cellSets,
          selected: [
            ...storeState.cellSets.selected, 'cluster-a', 'cluster-b', 'cluster-c',
          ],
        },
      },
    );

    const component = mount(
      <Provider store={store}>
        <CellSetsTool
          experimentId='1234'
          width={50}
          height={50}
        />
      </Provider>,
    );

    component.find('CellSetOperation').forEach((node) => {
      const { helpTitle, onCreate } = node.props();

      if (helpTitle.includes('Combine')) {
        // found the union operation, now execute the callback
        onCreate('union cluster', '#ff00ff');
        expect(store.getActions().length).toEqual(3);

        // Should create the appropriate union set.
        const createAction = store.getActions()[1];
        expect(createAction.payload.cellIds).toEqual(new Set([1, 2, 3, 4, 5]));
      }
    });

    // We should have found the union operation.
    expect.hasAssertions();
  });

  it('cell set operations should work appropriately for intersections', () => {
    const store = mockStore(
      {
        ...storeState,
        cellSets: {
          ...storeState.cellSets,
          selected: [
            ...storeState.cellSets.selected, 'cluster-a', 'cluster-b', 'cluster-c',
          ],
        },
      },
    );

    const component = mount(
      <Provider store={store}>
        <CellSetsTool
          experimentId='1234'
          width={50}
          height={50}
        />
      </Provider>,
    );

    component.find('CellSetOperation').forEach((node) => {
      const { helpTitle, onCreate } = node.props();

      if (helpTitle.includes('intersection')) {
        // found the union operation, now execute the callback
        onCreate('intersection cluster', '#ff00ff');
        expect(store.getActions().length).toEqual(3);

        // Should create the appropriate intersection set.
        const createAction = store.getActions()[1];
        expect(createAction.payload.cellIds).toEqual(new Set([2]));
      }
    });

    // We should have found the union operation.
    expect.hasAssertions();
  });

  it('cell set operations should work appropriately for complement', () => {
    const store = mockStore(
      {
        ...storeState,
        cellSets: {
          ...storeState.cellSets,
          selected: [
            ...storeState.cellSets.selected, 'scratchpad-a', 'cluster-c',
          ],
        },
      },
    );

    const component = mount(
      <Provider store={store}>
        <CellSetsTool
          experimentId='1234'
          width={50}
          height={50}
        />
      </Provider>,
    );

    component.find('CellSetOperation').forEach((node) => {
      const { helpTitle, onCreate } = node.props();

      if (helpTitle.includes('complement')) {
        // found the union operation, now execute the callback
        onCreate('complement cluster', '#ff00ff');
        expect(store.getActions().length).toEqual(3);

        // Should create the appropriate intersection set.
        const createAction = store.getActions()[1];
        expect(createAction.payload.cellIds).toEqual(new Set([1, 4]));
      }
    });

    // We should have found the union operation.
    expect.hasAssertions();
  });
});
