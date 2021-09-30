import React from 'react';

import {
  render, screen, fireEvent,
} from '@testing-library/react';
import { act } from 'react-dom/test-utils';

import preloadAll from 'jest-next-dynamic';
import { Provider, useDispatch } from 'react-redux';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import CellSetsTool, { generateFilteredCellIndices } from '../../../../components/data-exploration/cell-sets-tool/CellSetsTool';
import { makeStore } from '../../../../redux/store';
import { createCellSet, updateCellSetSelected } from '../../../../redux/actions/cellSets';
import { complement, intersection, union } from '../../../../utils/cellSetOperations';

const cellSetsData = require('../../../data/cell_sets.json');

jest.mock('localforage');

jest.mock('../../../../utils/socketConnection', () => ({
  __esModule: true,
  default: new Promise((resolve) => {
    resolve({ emit: jest.fn(), on: jest.fn(), id: '5678' });
  }),
}));

let storeState;
const experimentId = '1234';

describe('CellSetsTool', () => {
  beforeEach(async () => {
    enableFetchMocks();
    await preloadAll();
    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockResponse(JSON.stringify(cellSetsData));
    storeState = makeStore();
  });

  const getChildrenInHierarchy = (hierarchyKey) => {
    const hierarchy = storeState.getState().cellSets.hierarchy.filter((h) => h.key === hierarchyKey)[0].children;
    const children = hierarchy.map((child) => child.key);
    return children;
  };

  const selectFirstNCellSets = ((n) => {
    // get all keys of children in louvain hierarchy
    const cellSetKeys = getChildrenInHierarchy('louvain');

    // raise an error if we try to select more clusters than we actually have
    if (cellSetKeys.length < n) {
      console.error('Something happened with the test data and there are no longer at least n keys in the cell set object');
    }
    storeState.dispatch(updateCellSetSelected(experimentId, cellSetKeys.slice(0, n), 'cellSets'));
  });

  it('renders correctly cell set tool with no clusters in custom cell sets', async () => {
    await act(async () => {
      render(
        <Provider store={storeState}>
          <CellSetsTool
            experimentId='1234'
            width={50}
            height={50}
          />
        </Provider>,
      );
    });

    // There should be a tab for cell sets
    await screen.getByText(/Cell sets/);

    // // There should be a tab for metadata
    await screen.getByText(/Metadata/i);

    const editButtons = await screen.getAllByLabelText(/Edit/);
    expect(editButtons.length).toEqual(15);

    // There should be no delete buttons.
    const deleteButtons = screen.queryByText(/Delete/);
    expect(deleteButtons).toBeNull();
  });

  it('renders correctly cell set tool with clusters in custom cell sets', async () => {
    await act(async () => {
      render(
        <Provider store={storeState}>
          <CellSetsTool
            experimentId='1234'
            width={50}
            height={50}
          />
        </Provider>,
      );
    });

    // a different way to create a new cluster by directly calling the actionType
    // I thought that it is not a good idea, because in order to make it work, I have to
    // redo the whole createCellSet code in here, which won't be testing the reality and
    // will need changing every time we change the logic of createCellSet.

    // storeState.dispatch({
    //   type: CELL_SETS_CREATE,
    //   payload: {
    //     cellIds: new Set([1070, 5625, 2854, 5093, 2748]),
    //     color: '#3957ff',
    //     experimentId: 'cf6be70f5a9ed32f74ac686f18a0d951',
    //     key: 'f01a7023-3a48-4085-83be-4567211702a4',
    //     name: 'New Cluster',
    //   },
    // });

    // create a new cluster:
    await act(async () => {
      storeState.dispatch(createCellSet(experimentId, 'New Cluster', '#3957ff', new Set([1070, 5625, 2854, 5093, 2748])));
    });

    // There should be a tab for cell sets
    await screen.getByText(/Cell sets/);

    // // There should be a tab for metadata
    await screen.getByText(/Metadata/);

    // There should be delete buttons for clusters under Custom cell sets.
    const deleteButtons = await screen.getAllByLabelText(/Delete/);
    expect(deleteButtons.length).toEqual(1);
  });

  it('cell set operations should not render when no cell sets are selected', async () => {
    await act(async () => {
      render(
        <Provider store={storeState}>
          <CellSetsTool
            experimentId='1234'
            width={50}
            height={50}
          />
        </Provider>,
      );
    });

    const cellSetOperations = await screen.queryByLabelText(/of selected$/i);

    // There should be no operations rendered
    expect(cellSetOperations).toEqual(null);
  });

  it('cell set operations should render when cell sets are selected', async () => {
    await act(async () => {
      render(
        <Provider store={storeState}>
          <CellSetsTool
            experimentId='1234'
            width={50}
            height={50}
          />
        </Provider>,
      );
    });

    // select some cells
    await act(async () => {
      selectFirstNCellSets(3);
    });

    const cellSetOperations = await screen.getAllByLabelText(/of selected$/i);

    // There should be three operations rendered.
    expect(cellSetOperations.length).toEqual(3);
  });

  it('can compute a union of 2 cell sets', async () => {
    await act(async () => {
      render(
        <Provider store={storeState}>
          <CellSetsTool
            experimentId='1234'
            width={50}
            height={50}
          />
        </Provider>,
      );
    });

    // select some cells
    await act(async () => {
      selectFirstNCellSets(2);
    });

    // ensure that initially we have 0 custom cell sets
    const customCellSets = getChildrenInHierarchy('scratchpad');
    expect(customCellSets.length).toEqual(0);

    const unionOperation = await screen.getByLabelText(/Union of selected$/i);
    await act(async () => {
      await fireEvent(
        unionOperation,
        new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
        }),
      );
    });

    const saveButton = await screen.getByLabelText(/Save/i);
    await act(async () => {
      await fireEvent(
        saveButton,
        new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
        }),
      );
    });

    const newClusterIds = getChildrenInHierarchy('scratchpad');
    expect(newClusterIds.length).toEqual(1);

    // get the ids of the louvain clusters we created a union of
    const louvainClusters = getChildrenInHierarchy('louvain');
    // compute their union
    const expectedUnion = union(louvainClusters.slice(0, 2), storeState.getState().cellSets.properties);

    // get the cell ids of the new cluster that got created as the union of those clusters
    const actualUnion = storeState.getState().cellSets.properties[newClusterIds].cellIds;

    expect(expectedUnion).toEqual(actualUnion);
  });

  it('New cluster is created when the intersection of two sets contains cells', async () => {
    await act(async () => {
      render(
        <Provider store={storeState}>
          <CellSetsTool
            experimentId='1234'
            width={50}
            height={50}
          />
        </Provider>,
      );
    });

    // select the first sample and first louvain cluster and hope that they will share cell ids
    // and the intersection will not be empty
    const louvainClusterCellSet = getChildrenInHierarchy('louvain')[0];
    const sampleClusterCellSet = getChildrenInHierarchy('sample')[0];

    await act(async () => {
      storeState.dispatch(updateCellSetSelected(experimentId, [louvainClusterCellSet, sampleClusterCellSet], 'cellSets'));
    });

    // ensure that initially we have 0 custom cell sets
    const customCellSets = getChildrenInHierarchy('scratchpad');
    expect(customCellSets.length).toEqual(0);

    const intersectOperation = await screen.getByLabelText(/Intersection of selected$/i);
    await fireEvent(
      intersectOperation,
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      }),
    );

    const saveButton = await screen.getByLabelText(/Save/i);
    await fireEvent(
      saveButton,
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      }),
    );

    const newClusterIds = getChildrenInHierarchy('scratchpad');
    expect(newClusterIds.length).toEqual(1);

    const expectedIntersection = intersection(
      [louvainClusterCellSet, sampleClusterCellSet],
      storeState.getState().cellSets.properties,
    );

    if (expectedIntersection.size === 0) {
      console.error('This test will fail because your dataset does not contain common cells between the chosen clusters.');
    }
    const actualIntersection = storeState.getState().cellSets.properties[newClusterIds].cellIds;
    expect(expectedIntersection).toEqual(actualIntersection);
  });

  it('New cluster is not created when cancel is clicked', async () => {
    await act(async () => {
      render(
        <Provider store={storeState}>
          <CellSetsTool
            experimentId='1234'
            width={50}
            height={50}
          />
        </Provider>,
      );
    });

    // select the first sample and first louvain cluster and hope that they will share cell ids
    // and the intersection will not be empty
    const louvainClusterCellSet = getChildrenInHierarchy('louvain')[0];
    const sampleClusterCellSet = getChildrenInHierarchy('sample')[0];

    await act(async () => {
      storeState.dispatch(updateCellSetSelected(experimentId, [louvainClusterCellSet], 'cellSets'));
      storeState.dispatch(updateCellSetSelected(experimentId, [sampleClusterCellSet], 'metadataCategorical'));
    });

    // ensure that initially we have 0 custom cell sets
    const customCellSets = getChildrenInHierarchy('scratchpad');
    expect(customCellSets.length).toEqual(0);

    const intersectOperation = await screen.getByLabelText(/Intersection of selected$/i);
    await fireEvent(
      intersectOperation,
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      }),
    );

    const cancelButton = await screen.getByLabelText(/Cancel/i);
    await fireEvent(
      cancelButton,
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      }),
    );

    const newClusterIds = getChildrenInHierarchy('scratchpad');
    expect(newClusterIds.length).toEqual(0);
  });

  it('New cluster is not created if it will contain no cells', async () => {
    await act(async () => {
      render(
        <Provider store={storeState}>
          <CellSetsTool
            experimentId='1234'
            width={50}
            height={50}
          />
        </Provider>,
      );
    });

    // select some cells
    await act(async () => {
      selectFirstNCellSets(2);
    });

    // ensure that initially we have 0 custom cell sets
    const customCellSets = getChildrenInHierarchy('scratchpad');
    expect(customCellSets.length).toEqual(0);

    const intersectOperation = await screen.getByLabelText(/Intersection of selected$/i);
    await fireEvent(
      intersectOperation,
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      }),
    );

    const saveButton = await screen.getByLabelText(/Save/i);
    await fireEvent(
      saveButton,
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      }),
    );

    const newClusterIds = getChildrenInHierarchy('scratchpad');
    expect(newClusterIds.length).toEqual(0);

    const louvainClusters = getChildrenInHierarchy('louvain');

    // compute their intersection
    const expectedIntersection = intersection(
      [louvainClusters.slice(0, 2)],
      storeState.getState().cellSets.properties,
    );
    expect(expectedIntersection.size).toEqual(0);
  });

  it('cell set operations should work appropriately for complement', async () => {
    await act(async () => {
      render(
        <Provider store={storeState}>
          <CellSetsTool
            experimentId='1234'
            width={50}
            height={50}
          />
        </Provider>,
      );
    });

    // select the first first louvain cluster
    const louvainClusterCellSet = getChildrenInHierarchy('louvain')[0];

    await act(async () => {
      storeState.dispatch(updateCellSetSelected(experimentId, [louvainClusterCellSet], 'cellSets'));
    });

    // ensure that initially we have 0 custom cell sets
    const customCellSets = getChildrenInHierarchy('scratchpad');
    expect(customCellSets.length).toEqual(0);

    const complementOperation = await screen.getByLabelText(/Complement of selected$/i);
    await fireEvent(
      complementOperation,
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      }),
    );

    const saveButton = await screen.getByLabelText(/Save/i);

    await fireEvent(
      saveButton,
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      }),
    );

    const newClusterIds = getChildrenInHierarchy('scratchpad');
    expect(newClusterIds.length).toEqual(1);

    // compute their complement
    const expectedComplement = complement([louvainClusterCellSet], storeState.getState().cellSets.properties);

    if (expectedComplement.size === 0) {
      console.error('This test will fail because your dataset does not contain common cells between the chosen clusters.');
    }
    const actualComplement = storeState.getState().cellSets.properties[newClusterIds].cellIds;

    expect(expectedComplement).toEqual(actualComplement);
  });

  it('selected cell sets show selected in both tabs', async () => {
    await act(async () => {
      render(
        <Provider store={storeState}>
          <CellSetsTool
            experimentId='1234'
            width={50}
            height={50}
          />
        </Provider>,
      );
    });

    // select the second sample and first louvain cluster
    const louvainClusterCellSet = getChildrenInHierarchy('louvain')[0];
    const sampleClusterCellSet = getChildrenInHierarchy('sample')[1];

    await act(async () => {
      storeState.dispatch(updateCellSetSelected(experimentId, [louvainClusterCellSet], 'cellSets'));
      storeState.dispatch(updateCellSetSelected(experimentId, [sampleClusterCellSet], 'metadataCategorical'));
    });

    const actualNumbSelectedLouvainCells = storeState.getState().cellSets.properties[louvainClusterCellSet].cellIds.size;

    await screen.getByText(`${actualNumbSelectedLouvainCells} cells selected`);

    const metadataTabButton = await screen.getByText(/Metadata/i);

    await act(async () => {
      await fireEvent(
        metadataTabButton,
        new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
        }),
      );
    });

    const actualNumbSelectedSampleCells = storeState.getState().cellSets.properties[sampleClusterCellSet].cellIds.size;

    await screen.getByText(`${actualNumbSelectedSampleCells} cells selected`);

    const cellSetTabButton = await screen.getByText(/Cell sets/);

    await act(async () => {
      await fireEvent(
        cellSetTabButton,
        new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
        }),
      );
    });

    await screen.getByText(`${actualNumbSelectedLouvainCells} cells selected`);
  });

  it('Scratchpad cluster deletion works ', async () => {
    await act(async () => {
      render(
        <Provider store={storeState}>
          <CellSetsTool
            experimentId='1234'
            width={50}
            height={50}
          />
        </Provider>,
      );
    });

    // create a new cluster:
    await act(async () => {
      storeState.dispatch(createCellSet(experimentId, 'New Cluster', '#3957ff', new Set([1070, 5625, 2854, 5093, 2748])));
    });

    let customCellSets = getChildrenInHierarchy('scratchpad');
    expect(customCellSets.length).toEqual(1);

    // There should be a delete button for the scratchpad cluster.
    const deleteButtons = await screen.getAllByLabelText(/Delete/);
    expect(deleteButtons.length).toEqual(1);

    // Clicking on one of the buttons...
    await act(async () => {
      await fireEvent(
        deleteButtons[0],
        new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
        }),
      );
    });

    customCellSets = getChildrenInHierarchy('scratchpad');
    expect(customCellSets.length).toEqual(0);
  });

  // it('calculates filtered cell indices correctly', () => {
  //   expect(generateFilteredCellIndices(storeState.getState().genes.expression.data))
  //     .toEqual(new Set([0]));
  // });
});
