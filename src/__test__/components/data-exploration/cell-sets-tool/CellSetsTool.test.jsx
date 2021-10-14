import React from 'react';
import _ from 'lodash';
import '__test__/test-utils/setupTests';

import {
  render, screen, fireEvent,
} from '@testing-library/react';
import { act } from 'react-dom/test-utils';

import { Provider } from 'react-redux';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import { fetchWork } from 'utils/work/fetchWork';

import CellSetsTool, { generateFilteredCellIndices } from 'components/data-exploration/cell-sets-tool/CellSetsTool';
import { createCellSet, updateCellSetSelected } from 'redux/actions/cellSets';
import { loadGeneExpression } from 'redux/actions/genes';
import { complement, intersection, union } from 'utils/cellSetOperations';
import { makeStore } from 'redux/store';

jest.mock('utils/work/fetchWork');

jest.mock('utils/socketConnection', () => ({
  __esModule: true,
  default: new Promise((resolve) => {
    resolve({ emit: jest.fn(), on: jest.fn(), id: '5678' });
  }),
}));

const cellSetsData = require('__test__/data/cell_sets.json');
const geneExpressionData = require('__test__/data/gene_expression.json');

const experimentId = '1234';

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

const cellSetToolFactory = (override = {}) => {
  const props = _.merge({
    experimentId,
    width: 50,
    height: 50,
  }, override);

  // eslint-disable-next-line react/jsx-props-no-spreading
  return <CellSetsTool {...props} />;
};

let storeState;
describe('CellSetsTool', () => {
  beforeEach(async () => {
    enableFetchMocks();
    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockResponse(JSON.stringify(cellSetsData));
    storeState = makeStore();
  });

  it('renders correctly cell set tool with no clusters in custom cell sets', async () => {
    await act(async () => {
      render(
        <Provider store={storeState}>
          {cellSetToolFactory()}
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
          {cellSetToolFactory()}
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
          {cellSetToolFactory()}
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
          {cellSetToolFactory()}
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
          {cellSetToolFactory()}
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

    // compute their union using the union function
    const expectedUnion = union(louvainClusters.slice(0, 2), storeState.getState().cellSets.properties);

    // test the union cellSet function
    const hardcodedUnion = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]);

    // get the cell ids of the new cluster that got created as the union of those clusters
    const actualUnion = storeState.getState().cellSets.properties[newClusterIds].cellIds;

    expect(actualUnion).toEqual(expectedUnion);

    // WARN: if you change the test cellSet dataset or which 2 clusters you select, this will fail
    expect(actualUnion).toEqual(hardcodedUnion);
  });

  it('New cluster is created when the intersection of two sets contains cells', async () => {
    await act(async () => {
      render(
        <Provider store={storeState}>
          {cellSetToolFactory()}
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
    expect(actualIntersection).toEqual(expectedIntersection);

    // test the intersection cellSet function
    const hardcodedIntersection = new Set([1, 2, 3, 4, 5, 6]);

    // WARN: if you change the test cellSet dataset or which 2 clusters you select, this will fail
    expect(actualIntersection).toEqual(hardcodedIntersection);
  });

  it('New cluster is not created when cancel is clicked', async () => {
    await act(async () => {
      render(
        <Provider store={storeState}>
          {cellSetToolFactory()}
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
          {cellSetToolFactory()}
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
          {cellSetToolFactory()}
        </Provider>,
      );
    });

    // select the first louvain cluster
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
    const expectedComplement = complement(
      [louvainClusterCellSet],
      storeState.getState().cellSets.properties,
    );

    if (expectedComplement.size === 0) {
      console.error('This test will fail because your dataset does not contain common cells between the chosen clusters.');
    }
    const actualComplement = storeState.getState().cellSets.properties[newClusterIds].cellIds;

    expect(actualComplement).toEqual(expectedComplement);

    // test the complement cellSet function
    const hardcodedComplement = new Set(
      [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
    );

    // WARN: if you change the test cellSet dataset or which 2 clusters you select, this will fail
    expect(actualComplement).toEqual(hardcodedComplement);
  });

  it('selected cell sets show selected in both tabs', async () => {
    await act(async () => {
      render(
        <Provider store={storeState}>
          {cellSetToolFactory()}
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
          {cellSetToolFactory()}
        </Provider>,
      );
    });

    // create a new cluster:
    await act(async () => {
      storeState.dispatch(createCellSet(experimentId, 'New Cluster', '#3957ff', new Set([1, 2, 3, 4, 5])));
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

  it('calculates filtered cell indices correctly', async () => {
    await act(async () => {
      render(
        <Provider store={storeState}>
          {cellSetToolFactory()}
        </Provider>,
      );
    });

    fetchWork.mockImplementationOnce(() => new Promise((resolve) => resolve(geneExpressionData)));

    await act(async () => {
      storeState.dispatch(loadGeneExpression(experimentId, ['TestGene'], '1234'));
    });
    const actualFilteredCellIndices = generateFilteredCellIndices(storeState.getState().genes.expression.data);
    const expectedFilteredCellIndices = new Set([4, 5, 12, 13, 14, 23]);

    expect(actualFilteredCellIndices).toEqual(expectedFilteredCellIndices);
  });
});
