import React from 'react';
import _ from 'lodash';
import '__test__/test-utils/setupTests';

import {
  render, screen, fireEvent,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react-dom/test-utils';

import { Provider } from 'react-redux';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import { fetchWork } from 'utils/work/fetchWork';

import CellSetsTool from 'components/data-exploration/cell-sets-tool/CellSetsTool';
import { createCellSet } from 'redux/actions/cellSets';
import { loadGeneExpression } from 'redux/actions/genes';
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

const cellSetToolFactory = (customProps = {}) => {
  const props = _.merge({
    experimentId,
    width: 50,
    height: 50,
  }, customProps);

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

    // create a new cluster:
    await act(async () => {
      storeState.dispatch(createCellSet(experimentId, 'New Cluster', '#3957ff', new Set([1, 2, 3, 4, 5])));
    });

    // There should be a tab for cell sets
    screen.getByText(/Cell sets/);

    // // There should be a tab for metadata
    screen.getByText(/Metadata/);

    // There should be delete buttons for clusters under Custom cell sets.
    const deleteButtons = screen.getAllByLabelText(/Delete/);
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

    // select the third louvain cluster
    const louvain3Cluster = screen.getByText('Cluster 3');
    userEvent.click(louvain3Cluster);

    const cellSetOperations = screen.getAllByLabelText(/of selected$/i);

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

    // select the third louvain cluster
    const louvain3Cluster = screen.getByText('Cluster 3');
    userEvent.click(louvain3Cluster);

    // select the fourth louvain cluster
    const louvain4Cluster = screen.getByText('Cluster 4');
    userEvent.click(louvain4Cluster);

    // ensure that initially we have 0 custom cell sets
    const customCellSets = getChildrenInHierarchy('scratchpad');
    expect(customCellSets.length).toEqual(0);

    const unionOperation = await screen.getByLabelText(/Union of selected$/i);
    userEvent.click(unionOperation);

    const saveButton = await screen.getByLabelText(/Save/i);
    await act(async () => {
      fireEvent(
        saveButton,
        new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
        }),
      );
    });

    const newClusterIds = getChildrenInHierarchy('scratchpad');
    expect(newClusterIds.length).toEqual(1);

    // test the union cellSet function
    const hardcodedUnion = new Set([12, 13, 14, 15]);

    // get the cell ids of the new cluster that got created as the union of those clusters
    const actualUnion = storeState.getState().cellSets.properties[newClusterIds].cellIds;

    expect(actualUnion).toEqual(hardcodedUnion);
  });

  it('can compute an intersection of 2 cell sets', async () => {
    await act(async () => {
      render(
        <Provider store={storeState}>
          {cellSetToolFactory()}
        </Provider>,
      );
    });

    // ensure that initially we have 0 custom cell sets
    const customCellSets = getChildrenInHierarchy('scratchpad');
    expect(customCellSets.length).toEqual(0);

    // create a new cluster with some cells that will overlap:
    await act(async () => {
      storeState.dispatch(createCellSet(experimentId, 'test cluster', '#3957ff', new Set([1, 2, 3, 4])));
    });
    // select the newly created cluster
    const scratchpadCluster = screen.getByText('test cluster');
    userEvent.click(scratchpadCluster);

    // select the first louvain cluster
    const louvain0Cluster = screen.getByText('Cluster 0');
    userEvent.click(louvain0Cluster);

    const intersectOperation = screen.getByLabelText(/Intersection of selected$/i);
    userEvent.click(intersectOperation);

    const saveButton = screen.getByLabelText(/Save/i);
    await act(async () => {
      fireEvent(
        saveButton,
        new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
        }),
      );
    });

    const newClusterKeys = getChildrenInHierarchy('scratchpad');
    expect(newClusterKeys.length).toEqual(2);

    // relies on the fact that when we create a new cluster, we add it after the existing ones
    const unionScratchpadCluster = newClusterKeys[1];
    const actualIntersection = storeState.getState().cellSets.properties[unionScratchpadCluster].cellIds;
    const expectedIntersection = new Set([1, 2, 3, 4]);

    expect(actualIntersection).toEqual(expectedIntersection);
  });

  it('New cluster is not created when cancel is clicked', async () => {
    await act(async () => {
      render(
        <Provider store={storeState}>
          {cellSetToolFactory()}
        </Provider>,
      );
    });

    // ensure that initially we have 0 custom cell sets
    const customCellSets = getChildrenInHierarchy('scratchpad');
    expect(customCellSets.length).toEqual(0);

    // create a new cluster with some cells that will overlap:
    await act(async () => {
      storeState.dispatch(createCellSet(experimentId, 'test cluster', '#3957ff', new Set([1, 2, 3, 4])));
    });
    // select the newly created cluster
    const scratchpadCluster = screen.getByText('test cluster');
    userEvent.click(scratchpadCluster);

    // select the first louvain cluster
    const louvain0Cluster = screen.getByText('Cluster 0');
    userEvent.click(louvain0Cluster);

    const intersectOperation = await screen.getByLabelText(/Intersection of selected$/i);
    userEvent.click(intersectOperation);

    const cancelButton = await screen.getByLabelText(/Cancel/i);
    await fireEvent(
      cancelButton,
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      }),
    );
    expect(screen.queryByText('New Cluster')).toBeNull();
  });

  it('New cluster is not created if it will contain no cells', async () => {
    await act(async () => {
      render(
        <Provider store={storeState}>
          {cellSetToolFactory()}
        </Provider>,
      );
    });

    // select the first louvain cluster
    const louvain0Cluster = screen.getByText('Cluster 0');
    userEvent.click(louvain0Cluster);

    // select the second louvain cluster
    const louvain1Cluster = screen.getByText('Cluster 1');
    userEvent.click(louvain1Cluster);

    // ensure that initially we have 0 custom cell sets
    const customCellSets = getChildrenInHierarchy('scratchpad');
    expect(customCellSets.length).toEqual(0);

    const intersectOperation = await screen.getByLabelText(/Intersection of selected$/i);
    userEvent.click(intersectOperation);

    const saveButton = await screen.getByLabelText(/Save/i);
    await act(async () => {
      fireEvent(
        saveButton,
        new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
        }),
      );
    });

    const newClusterIds = getChildrenInHierarchy('scratchpad');
    expect(newClusterIds.length).toEqual(0);
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
    const louvain0Cluster = screen.getByText('Cluster 0');
    userEvent.click(louvain0Cluster);

    // compute the complement
    const complementOperation = await screen.findByLabelText(/Complement of selected$/i);
    userEvent.click(complementOperation);

    // save the new cluster
    const saveButton = await screen.findByLabelText(/Save/i);
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

    const actualComplement = storeState.getState().cellSets.properties[newClusterIds].cellIds;

    const hardcodedComplement = new Set(
      [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
    );

    // complement = the whole dataset - first cluster
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

    // select the first louvain cluster
    const louvain0Cluster = screen.getByText('Cluster 0');
    userEvent.click(louvain0Cluster);

    screen.getByText('6 cells selected');

    const metadataTabButton = screen.getByText(/Metadata/i);
    userEvent.click(metadataTabButton);

    // select some sample clusters
    const wt1Cluster = screen.getByText('WT1');
    userEvent.click(wt1Cluster);
    const wt2Cluster = screen.getByText('WT2');
    userEvent.click(wt2Cluster);

    screen.getByText('20 cells selected');
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
    const deleteButtons = screen.getAllByLabelText(/Delete/);
    expect(deleteButtons.length).toEqual(1);

    // Clicking on one of the buttons...
    userEvent.click(deleteButtons[0]);

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

    // select the first louvain cluster
    const louvain0Cluster = screen.getByText('Cluster 0');
    userEvent.click(louvain0Cluster);

    screen.getByText(/4 cells selected/);
  });

  it('Displays a cell set hidden message when cluster is hidden', async () => {
    await act(async () => {
      render(
        <Provider store={storeState}>
          {cellSetToolFactory()}
        </Provider>,
      );
    });

    // hide the first cluster
    const hideButtons = screen.getAllByText('Hide');
    userEvent.click(hideButtons[0]);

    screen.getByText(/1 cell set is currently hidden./);
    screen.getAllByText(/Unhide all/);
  });

  it('Unhides clusters when the unhide button is presssed', async () => {
    await act(async () => {
      render(
        <Provider store={storeState}>
          {cellSetToolFactory()}
        </Provider>,
      );
    });

    // hide the first cluster
    let hideButtons = screen.getAllByText('Hide');
    userEvent.click(hideButtons[0]);

    // hide the second cluster
    hideButtons = screen.getAllByText('Hide');
    userEvent.click(hideButtons[0]);

    screen.getByText(/2 cell sets are currently hidden./);

    const unhideButton = screen.getAllByText('Unhide');
    expect(unhideButton.length).toEqual(2);

    // now unhide the first cluster
    userEvent.click(unhideButton[0]);

    screen.getByText('Unhide');
    screen.getByText(/1 cell set is currently hidden./);
    screen.getAllByText(/Unhide all/);
  });

  it('Unhides everything when the unhide all button is presssed', async () => {
    await act(async () => {
      render(
        <Provider store={storeState}>
          {cellSetToolFactory()}
        </Provider>,
      );
    });

    let hideButtons = screen.getAllByText('Hide');
    expect(hideButtons.length).toEqual(14);

    // hide the first cluster
    userEvent.click(hideButtons[0]);

    hideButtons = screen.getAllByText('Hide');
    expect(hideButtons.length).toEqual(13);

    // hide the second cluster
    userEvent.click(hideButtons[0]);

    screen.getByText(/2 cell sets are currently hidden./);

    const unhideAllButton = screen.getAllByText('Unhide all');
    expect(unhideAllButton.length).toEqual(1);

    const unhideButtons = screen.getAllByText('Unhide');
    expect(unhideButtons.length).toEqual(2);

    // now unhide all clusters
    userEvent.click(unhideAllButton[0]);

    expect(screen.queryByText(/2 cell sets are currently hidden./)).toBeNull();
    expect(screen.queryByText('Unhide')).toBeNull();
  });
});
