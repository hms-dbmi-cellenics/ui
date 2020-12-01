import React from 'react';
import { Provider, useDispatch } from 'react-redux';
import { mount, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { Button } from 'antd';
import HierarchicalTree from '../../../../../../../pages/experiments/[experimentId]/data-exploration/components/hierarchical-tree/HierarchicalTree';
import composeTree from '../../../../../../../utils/composeTree';
import {
  deleteCellSet,
  updateCellSetHierarchy,
  updateCellSetSelected,
  updateCellSetProperty,
} from '../../../../../../../redux/actions/cellSets';

const experimentId = '1234';
const mockStore = configureMockStore([thunk]);
const onNodeUpdate = (key, data, store) => {
  store.dispatch(updateCellSetProperty(experimentId, key, data));
};

const onNodeDelete = (key, store) => {
  store.dispatch(deleteCellSet(experimentId, key));
};

const onHierarchyUpdate = (newHierarchy, store) => {
  store.dispatch(updateCellSetHierarchy(experimentId, newHierarchy));
};

const onCheck = (keys, store) => {
  store.dispatch(updateCellSetSelected(experimentId, keys));
};
const properties = {
  '93f92520-af56-409e-8bd4-3f1db111aa07': {
    cellIds: ['764', '30', '1058', '683', '621', '722', '103', '206'],
    color: '#c9080a',
    name: 'test',
    rootNode: undefined,
  },
  'louvain-0': {
    cellIds: [0, 21, 29, 31, 34, 55, 58, 61, 67, 69, 70, 72, 73],
    color: '#e377c2',
    name: 'Cluster 0',
    rootNode: undefined,
  },
};
describe('cell sets tool', () => {
  configure({ adapter: new Adapter() });
  test('Check that delete button is not present for louvain', () => {
    const fakeStore = {
      cellSets: {
        error: false,
        hierarchy: {
          0: {
            0: { key: 'louvain-0' },
            key: 'louvain',
          },
        },
      },
    };
    const store = mockStore({ fakeStore });
    const component = mount(
      <Provider store={store}>
        <HierarchicalTree
          treeData={composeTree(fakeStore.cellSets.hierarchy, properties)}
          onCheck={onCheck}
          onNodeUpdate={onNodeUpdate}
          onNodeDelete={onNodeDelete}
          onHierarchyUpdate={onHierarchyUpdate}
          defaultExpandAll
        />
      </Provider>,
    );
    expect(component.find(Button).length).toEqual(0);
  });
  /* test('Delete option is available for not louvain clusters', () => {
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
  }); */
});
