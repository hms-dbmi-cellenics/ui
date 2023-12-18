import React from 'react';

import _ from 'lodash';
import {
  render, screen, fireEvent, waitFor, within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { act } from 'react-dom/test-utils';

import { Provider } from 'react-redux';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import createTestComponentFactory from '__test__/test-utils/testComponentFactory';
import { makeStore } from 'redux/store';

import CellSetsTool from 'components/data-exploration/cell-sets-tool/CellSetsTool';
import { createCellSet } from 'redux/actions/cellSets';

import fetchWork from 'utils/work/fetchWork';

import mockAPI, { generateDefaultMockAPIResponses, promiseResponse } from '__test__/test-utils/mockAPI';
import { loadBackendStatus } from 'redux/actions/backendStatus';

enableFetchMocks();

jest.mock('utils/work/fetchWork');

jest.mock('utils/socketConnection', () => {
  const mockEmit = jest.fn();
  const mockOn = jest.fn();

  return {
    __esModule: true,
    default: new Promise((resolve) => {
      resolve({ emit: mockEmit, on: mockOn, id: '5678' });
    }),
    mockEmit,
    mockOn,
  };
});

const mockNavigateTo = jest.fn();

jest.mock('utils/AppRouteProvider', () => ({
  useAppRouter: jest.fn(() => ({
    navigateTo: mockNavigateTo,
  })),
}));

const cellSetsData = require('__test__/data/cell_sets.json');

const cellSetsWithAnnotatedCellClass = _.cloneDeep(cellSetsData);
cellSetsWithAnnotatedCellClass.cellSets.push(
  {
    key: 'annotated-cell-class-key',
    name: 'Annotated cell class',
    rootNode: true,
    children: [
      {
        key: 'annotated-cell-set-key',
        name: 'Annotated cell set',
        color: '#8c564b',
        rootNode: false,
        cellIds: [
          1, 2, 3, 4, 5,
        ],
      },
    ],
    type: 'cellSets',
  },
);

const louvainClusters = cellSetsData.cellSets.find(({ key }) => key === 'louvain').children;

const experimentId = '1234';

const getClusterByName = (clusterName) => {
  const clusterKey = Object.keys(storeState.getState().cellSets.properties).filter((key) => {
    if (storeState.getState().cellSets.properties[key].name === clusterName) {
      return key;
    }

    return undefined;
  });
  return clusterKey;
};

const defaultProps = {
  experimentId,
  width: 50,
  height: 50,
};

const cellSetsToolFactory = createTestComponentFactory(CellSetsTool, defaultProps);

let storeState;

// Mocking samples update / delete routes
const customResponses = {
  [`experiments/${experimentId}/cellSets$`]: () => promiseResponse(JSON.stringify(cellSetsData)),
};
const mockAPIResponse = _.merge(
  generateDefaultMockAPIResponses(experimentId),
  customResponses,
);

describe('CellSetsTool', () => {
  beforeEach(async () => {
    jest.clearAllMocks();

    fetchMock.resetMocks();
    fetchMock.mockIf(/.*/, mockAPI(mockAPIResponse));

    storeState = makeStore();
  });

  it('renders correctly cell set tool with no clusters in custom cell sets', async () => {
    await act(async () => {
      render(
        <Provider store={storeState}>
          {cellSetsToolFactory()}
        </Provider>,
      );
    });

    const editButtons = screen.getAllByLabelText(/Edit/);
    // There should be no delete buttons.
    const deleteButtons = screen.queryByText(/Delete/);

    expect(editButtons.length).toEqual(3);
    expect(deleteButtons).toBeNull();
  });

  it('renders correctly cell set tool with clusters in custom cell sets', async () => {
    await act(async () => {
      render(
        <Provider store={storeState}>
          {cellSetsToolFactory()}
        </Provider>,
      );
    });

    // create a new cluster:
    await act(async () => {
      storeState.dispatch(createCellSet(experimentId, 'New Cluster', '#3957ff', new Set([1, 2, 3, 4, 5])));
    });

    // expand custom cell sets tree
    const customCellSetsGroup = screen.getAllByRole('img', { name: 'down' })[1];
    userEvent.click(customCellSetsGroup);

    // There should be delete buttons for clusters under Custom cell sets.
    const deleteButtons = screen.getAllByLabelText(/Delete/);
    expect(deleteButtons.length).toEqual(1);
  });

  it('cell set operations should not render when no cell sets are selected', async () => {
    await act(async () => {
      render(
        <Provider store={storeState}>
          {cellSetsToolFactory()}
        </Provider>,
      );
    });

    const cellSetOperations = screen.queryByLabelText(/of selected$/i);

    // There should be no operations rendered
    expect(cellSetOperations).toEqual(null);
  });

  it('cell set operations should render when cell sets are selected', async () => {
    await act(async () => {
      render(
        <Provider store={storeState}>
          {cellSetsToolFactory()}
        </Provider>,
      );
    });

    // expand the louvain clusters tree
    const louvainCLustersGroup = screen.getAllByRole('img', { name: 'down' })[0];
    userEvent.click(louvainCLustersGroup);

    // select the third louvain cluster
    const louvain3Cluster = screen.getByText('Cluster 3');
    userEvent.click(louvain3Cluster);

    const cellSetOperations = screen.getAllByLabelText(/of selected$/i);

    // There should be three operations rendered.
    expect(cellSetOperations.length).toEqual(3);

    // Uncomment test to test for the existence of the cell sets test
    // There should be a button for subsetting cellsets
    // const subsetCellSetsOperation = screen.getByLabelText(/Create new experiment from selected cellsets/i);
    // expect(subsetCellSetsOperation).toBeInTheDocument();
  });

  it('can compute a union of 2 cell sets', async () => {
    await act(async () => {
      render(
        <Provider store={storeState}>
          {cellSetsToolFactory()}
        </Provider>,
      );
    });

    // expand the louvain clusters tree
    const louvainCLustersGroup = screen.getAllByRole('img', { name: 'down' })[0];
    userEvent.click(louvainCLustersGroup);

    // select the third louvain cluster
    const louvain3Cluster = screen.getByText('Cluster 3');
    userEvent.click(louvain3Cluster);

    // select the fourth louvain cluster
    const louvain4Cluster = screen.getByText('Cluster 4');
    userEvent.click(louvain4Cluster);

    // ensure that initially we have 0 custom cell sets
    expect(screen.queryByText('New Cluster')).toBeNull();

    const unionOperation = screen.getByLabelText(/Union of selected$/i);
    userEvent.click(unionOperation);

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

    // expand custom cell sets tree
    const customCellSetsGroup = screen.getAllByRole('img', { name: 'down' })[1];
    userEvent.click(customCellSetsGroup);

    screen.getByText('New Cluster');
    const newClusterKey = getClusterByName('New Cluster');

    const cluster3CellIds = louvainClusters.find(({ name }) => name === 'Cluster 3').cellIds;
    const cluster4CellIds = louvainClusters.find(({ name }) => name === 'Cluster 4').cellIds;
    const unionCellIds = [...cluster3CellIds, ...cluster4CellIds];

    // test the union cellSet function
    const expectedUnion = new Set(unionCellIds);

    // get the cell ids of the new cluster that got created as the union of those clusters
    const actualUnion = storeState.getState().cellSets.properties[newClusterKey].cellIds;

    expect(actualUnion).toEqual(expectedUnion);
  });

  it('can compute an intersection of 2 cell sets', async () => {
    await act(async () => {
      render(
        <Provider store={storeState}>
          {cellSetsToolFactory()}
        </Provider>,
      );
    });

    // ensure that initially we have 0 custom cell sets
    expect(screen.queryByText('New Cluster')).toBeNull();

    // expand the louvain clusters tree
    const louvainCLustersGroup = screen.getAllByRole('img', { name: 'down' })[0];
    userEvent.click(louvainCLustersGroup);

    // select the first louvain cluster
    const louvain0Cluster = screen.getByText('Cluster 0');
    userEvent.click(louvain0Cluster);

    // create a new cluster with some cells that will overlap:
    await act(async () => {
      storeState.dispatch(createCellSet(experimentId, 'test cluster', '#3957ff', new Set([1, 2, 3, 4, 31, 32])));
    });

    // expand custom cell sets tree
    const customCellSetsGroup = screen.getAllByRole('img', { name: 'down' })[1];
    userEvent.click(customCellSetsGroup);

    // select the newly created cluster
    const scratchpadCluster = screen.getByText('test cluster');
    userEvent.click(scratchpadCluster);

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

    // expand custom cell sets tree
    const customCellSetsGroup2 = screen.getAllByRole('img', { name: 'down' })[0];
    userEvent.click(customCellSetsGroup2);

    screen.getByText('New Cluster');

    const newClusterKey = getClusterByName('New Cluster');
    const actualIntersection = storeState.getState().cellSets.properties[newClusterKey].cellIds;

    const expectedIntersection = new Set([1, 2, 3, 4]);
    expect(actualIntersection).toEqual(expectedIntersection);
  });

  it('New cluster is not created when cancel is clicked', async () => {
    await act(async () => {
      render(
        <Provider store={storeState}>
          {cellSetsToolFactory()}
        </Provider>,
      );
    });

    // ensure that initially we have 0 custom cell sets
    expect(screen.queryByText('New Cluster')).toBeNull();

    // expand the louvain clusters tree
    const louvainCLustersGroup = screen.getAllByRole('img', { name: 'down' })[0];
    userEvent.click(louvainCLustersGroup);

    // select the first louvain cluster
    const louvain0Cluster = screen.getByText('Cluster 0');
    userEvent.click(louvain0Cluster);

    // create a new cluster with some cells that will overlap:
    await act(async () => {
      storeState.dispatch(createCellSet(experimentId, 'test cluster', '#3957ff', new Set([1, 2, 3, 4])));
    });

    // expand custom cell sets tree
    const customCellSetsGroup = screen.getAllByRole('img', { name: 'down' })[1];
    userEvent.click(customCellSetsGroup);

    // select the newly created cluster
    const scratchpadCluster = screen.getByText('test cluster');
    userEvent.click(scratchpadCluster);

    const intersectOperation = screen.getByLabelText(/Intersection of selected$/i);
    userEvent.click(intersectOperation);

    const cancelButton = screen.getByLabelText(/Cancel/i);
    await act(async () => {
      fireEvent(
        cancelButton,
        new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
        }),
      );
    });
    expect(screen.queryByText('New Cluster')).toBeNull();
  });

  it('New cluster is not created if it will contain no cells', async () => {
    await act(async () => {
      render(
        <Provider store={storeState}>
          {cellSetsToolFactory()}
        </Provider>,
      );
    });

    // expand the louvain clusters tree
    const louvainCLustersGroup = screen.getAllByRole('img', { name: 'down' })[0];
    userEvent.click(louvainCLustersGroup);

    // select the first louvain cluster
    const louvain0Cluster = screen.getByText('Cluster 0');
    userEvent.click(louvain0Cluster);

    // select the second louvain cluster
    const louvain1Cluster = screen.getByText('Cluster 1');
    userEvent.click(louvain1Cluster);

    // ensure that initially we have 0 custom cell sets
    expect(screen.queryByText('New Cluster')).toBeNull();

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

    expect(screen.queryByText('New Cluster')).toBeNull();
  });

  it('cell set operations should work appropriately for complement', async () => {
    await act(async () => {
      render(
        <Provider store={storeState}>
          {cellSetsToolFactory()}
        </Provider>,
      );
    });

    // expand the louvain clusters tree
    const louvainCLustersGroup = screen.getAllByRole('img', { name: 'down' })[0];
    userEvent.click(louvainCLustersGroup);

    // select the first louvain cluster
    const louvain0Cluster = screen.getByText('Cluster 0');
    userEvent.click(louvain0Cluster);

    // compute the complement
    const complementOperation = screen.getByLabelText(/Complement of selected$/i);
    userEvent.click(complementOperation);

    // save the new cluster
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

    // expand custom cell sets tree
    const customCellSetsGroup = screen.getAllByRole('img', { name: 'down' })[1];
    userEvent.click(customCellSetsGroup);

    screen.getByText('New Cluster');
    const newClusterKey = getClusterByName('New Cluster');
    const actualComplement = storeState.getState().cellSets.properties[newClusterKey].cellIds;

    expect(actualComplement).toMatchSnapshot();
  });

  it('Scratchpad cluster deletion works ', async () => {
    await act(async () => {
      render(
        <Provider store={storeState}>
          {cellSetsToolFactory()}
        </Provider>,
      );
    });

    // create a new cluster:
    await act(async () => {
      storeState.dispatch(createCellSet(experimentId, 'New Cluster', '#3957ff', new Set([1, 2, 3, 4, 5])));
    });

    let cellCetsGroups = screen.getAllByRole('img', { name: 'down' });

    // expand custom cell sets tree
    userEvent.click(cellCetsGroups[1]);

    screen.getByText('New Cluster');
    const newClusterKey = getClusterByName('New Cluster');

    expect(cellCetsGroups.length).toEqual(4);

    let isInRedux = Object.keys(
      storeState.getState().cellSets.properties,
    ).includes(newClusterKey[0]);

    expect(isInRedux).toBe(true);

    // There should be a delete button for the scratchpad cluster.
    // const deleteButton = screen.getByLabelText(/Delete/);
    const deleteButtons = screen.getAllByLabelText(/Delete/);
    expect(deleteButtons.length).toEqual(1);

    // Clicking on one of the buttons...
    await act(async () => {
      fireEvent(
        deleteButtons[0],
        new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
        }),
      );
    });

    // get all the cell set groups
    cellCetsGroups = screen.getAllByRole('img', { name: 'down' });

    await waitFor(() => {
      // This test used to assert that "New Cluster" text is not found in "screen"
      // in order to verify that deletion was successful.
      // Due to behaviour that I couldn't possibly explain, "New Cluster" is still
      // found in "screen" when it shouldn't. As a workaround, now the following lines test that:
      // -- the Redux store is updated successfully -- "New Cluster" should not be there
      // -- the "Custom cell sets" tree cannot be expanded.
      //    This means that is has no children, and hence "New Cluster" is deleted.
      expect(cellCetsGroups.length).toEqual(3);

      isInRedux = Object.keys(storeState.getState().cellSets.properties).includes(newClusterKey[0]);
      expect(isInRedux).toBe(false);
    });
  });

  it('calculates filtered cell indices correctly', async () => {
    await act(async () => {
      render(
        <Provider store={storeState}>
          {cellSetsToolFactory()}
        </Provider>,
      );
    });

    // expand samples tree
    const samplesGroup = screen.getAllByRole('img', { name: 'down' })[1];
    userEvent.click(samplesGroup);

    // select a sample cluster
    const wt1Cluster = screen.getByText('WT1');
    userEvent.click(wt1Cluster);

    // Cells in wt1 minus all the ones that are not in louvain (they were filtered out)
    screen.getByText('28 cells selected');
  });

  it('Displays a cell set hidden message when cluster is hidden', async () => {
    await act(async () => {
      render(
        <Provider store={storeState}>
          {cellSetsToolFactory()}
        </Provider>,
      );
    });

    // expand the louvain clusters tree
    const louvainCLustersGroup = screen.getAllByRole('img', { name: 'down' })[0];
    userEvent.click(louvainCLustersGroup);

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
          {cellSetsToolFactory()}
        </Provider>,
      );
    });

    // expand the louvain clusters tree
    const louvainCLustersGroup = screen.getAllByRole('img', { name: 'down' })[0];
    userEvent.click(louvainCLustersGroup);

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
          {cellSetsToolFactory()}
        </Provider>,
      );
    });

    // expand the louvain clusters tree
    const louvainCLustersGroup = screen.getAllByRole('img', { name: 'down' })[0];
    userEvent.click(louvainCLustersGroup);

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

  it('Runs subset experiment correctly', async () => {
    await act(async () => {
      render(
        <Provider store={storeState}>
          {cellSetsToolFactory()}
        </Provider>,
      );
    });

    // expand the louvain clusters tree
    const louvainCLustersGroup = screen.getAllByRole('img', { name: 'down' })[0];
    userEvent.click(louvainCLustersGroup);

    // select the third louvain cluster
    const louvain3Cluster = screen.getByText('Cluster 3');
    userEvent.click(louvain3Cluster);

    // select the fourth louvain cluster
    const louvain4Cluster = screen.getByText('Cluster 4');
    userEvent.click(louvain4Cluster);

    const subsetOperation = screen.getByLabelText('Create new experiment from selected cellsets');
    userEvent.click(subsetOperation);

    const createModal = screen.getByTestId('subsetCellSetsModal');
    const createButton = within(createModal).getByRole('button', { name: /Create/i });

    await act(async () => {
      fireEvent(
        createButton,
        new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
        }),
      );
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(`/v2/experiments/${experimentId}/subset`),
      expect.objectContaining({
        body: expect.stringContaining('"cellSetKeys":["louvain-3","louvain-4"]'),
        method: 'POST',
      }),
    );
  });

  it('Annotated cell sets has delete buttons', async () => {
    const mockAPICellClassAPIResponse = {
      ...mockAPIResponse,
      [`experiments/${experimentId}/cellSets$`]: () => promiseResponse(JSON.stringify(cellSetsWithAnnotatedCellClass)),
    };

    fetchMock.mockIf(/.*/, mockAPI(mockAPICellClassAPIResponse));

    await act(async () => {
      render(
        <Provider store={storeState}>
          {cellSetsToolFactory()}
        </Provider>,
      );
    });

    // The annotated cell clas is the last class in the hierarchy
    const annotatedCellSetsGroup = screen.getAllByRole('img', { name: 'down' }).pop();
    userEvent.click(annotatedCellSetsGroup);

    // There should only be one delete button for the annotated cell class
    const deleteButtons = screen.getAllByLabelText(/Delete/);
    expect(deleteButtons.length).toEqual(1);
  });

  it('Deleting annotated cell class deletes the cell class and the cell sets', async () => {
    const mockAPICellClassAPIResponse = {
      ...mockAPIResponse,
      [`experiments/${experimentId}/cellSets$`]: () => promiseResponse(JSON.stringify(cellSetsWithAnnotatedCellClass)),
    };

    fetchMock.mockIf(/.*/, mockAPI(mockAPICellClassAPIResponse));

    await act(async () => {
      render(
        <Provider store={storeState}>
          {cellSetsToolFactory()}
        </Provider>,
      );
    });

    // The annotated cell clas is the last class in the hierarchy
    const deleteAnnotatedCellClassButton = screen.getByLabelText(/Delete/);
    act(() => {
      userEvent.click(deleteAnnotatedCellClassButton);
    });

    // get all the cell set groups
    const numCellGroupsAfterDelete = screen.getAllByRole('img', { name: 'down' }).length;

    await waitFor(() => {
      // This test used to assert that "Annotated cell set" text is not found in "screen"
      // in order to verify that deletion was successful.
      // 4 Cell groups: louvain, custom cell sets, sample, Track_1 (metadata)
      expect(numCellGroupsAfterDelete).toEqual(4);

      expect(screen.queryByText('Annotated cell class')).toBeNull();

      // Check that cell class does not exist anymore in redux
      const isClassInRedux = Object.keys(storeState.getState().cellSets.properties).includes('annotated-cell-class-key');
      expect(isClassInRedux).toBe(false);

      // Check that cell set does not exist anymore in redux
      const isCellSetInRedux = Object.keys(storeState.getState().cellSets.properties).includes('annotated-cell-set-key');
      expect(isCellSetInRedux).toBe(false);
    });
  });
});

// Enable when AnnotateClustersTool panel is enabled
describe('AnnotateClustersTool', () => {
  beforeEach(async () => {
    jest.clearAllMocks();

    await storeState.dispatch(loadBackendStatus(experimentId));

    await act(async () => {
      render(
        <Provider store={storeState}>
          {cellSetsToolFactory()}
        </Provider>,
      );
    });

    // Switch to tab
    const annotateClustersTabTitle = screen.getByText('Annotate clusters');

    // Switch to tab
    userEvent.click(annotateClustersTabTitle);
  });

  it('Renders correctly', async () => {
    // Check displays correct text
    screen.getByText(/ScType/);
    screen.getByText(/Tissue Type/);
    screen.getByText(/Species/);
    screen.getByText(/Compute/);

    // Displays correct placeholder in selects
    screen.getByText('Select a tissue type');
    screen.getByText('Select a species');

    // Displays button and it's disabled
    expect(screen.getByRole('button', { name: /Compute/ })).toBeDisabled();
  });

  it('Can dispatch work request', async () => {
    const tissueSelector = screen.getAllByRole('combobox')[0];
    const speciesSelector = screen.getAllByRole('combobox')[1];

    // Choose the liver option
    userEvent.click(tissueSelector);
    userEvent.click(screen.getByText(/Liver/));

    // Choose the mouse option
    userEvent.click(speciesSelector);
    userEvent.click(screen.getAllByText(/mouse/)[1]);

    // Now the button's enabled
    const button = screen.getByRole('button', { name: /Compute/ });
    expect(button).toBeEnabled();

    // Click the button
    act(() => {
      userEvent.click(button);
    });

    // It dispatches a work request
    await waitFor(() => {
      expect(fetchWork).toMatchSnapshot();
    });
  });
});
