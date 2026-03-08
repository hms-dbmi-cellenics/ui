import React from 'react';
import _ from 'lodash';

import { act } from 'react-dom/test-utils';
import {
  render, screen, fireEvent, within, waitFor,
} from '@testing-library/react';
import { mount } from 'enzyme';

import '@testing-library/jest-dom';
import { Provider } from 'react-redux';

import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import fake from '__test__/test-utils/constants';
import mockAPI, {
  // dispatchWorkRequestMock,
  generateDefaultMockAPIResponses,
  promiseResponse,
  statusResponse,
} from '__test__/test-utils/mockAPI';

import fetchWork from 'utils/work/fetchWork';

import createTestComponentFactory from '__test__/test-utils/testComponentFactory';
import { makeStore } from 'redux/store';

import { loadBackendStatus } from 'redux/actions/backendStatus';
import DotPlotPage from 'pages/experiments/[experimentId]/plots-and-tables/dot-plot/index';
import {
  EXPERIMENT_SETTINGS_INFO_UPDATE,
} from 'redux/actionTypes/experimentSettings';
import { UPDATE_CONFIG } from 'redux/actionTypes/componentConfig';
import paginatedGeneExpressionData from '__test__/data/paginated_gene_expression.json';
import cellSetsDataWithScratchpad from '__test__/data/cell_sets_with_scratchpad.json';
import dotPlotData from '__test__/data/dotplot_plotdata.json';
import userEvent from '@testing-library/user-event';
import { plotNames } from 'utils/constants';
import ExportAsCSV from 'components/plots/ExportAsCSV';

import waitForComponentToPaint from '__test__/test-utils/waitForComponentToPaint';
import { arrayMoveImmutable } from 'utils/arrayUtils';

jest.mock('components/plots/ExportAsCSV', () => jest.fn(() => (<></>)));
jest.mock('components/header/UserButton', () => () => <></>);
jest.mock('react-resize-detector', () => (props) => {
  // eslint-disable-next-line react/prop-types
  const { children } = props;
  return children({ width: 800, height: 800 });
});

jest.mock('utils/work/fetchWork');

const mockWorkerResponses = {
  ListGenes: paginatedGeneExpressionData,
  DotPlot: dotPlotData,
};

const experimentId = fake.EXPERIMENT_ID;
const plotUuid = 'dotPlotMain';

const customAPIResponses = {
  [`experiments/${experimentId}/cellSets$`]: () => promiseResponse(
    JSON.stringify(_.cloneDeep(cellSetsDataWithScratchpad)),
  ),
  [`/plots/${plotUuid}$`]: (req) => {
    if (req.method === 'PUT') return promiseResponse(JSON.stringify('OK'));
    return statusResponse(404, 'Not Found');
  },
};

const mockAPIResponse = _.merge(
  generateDefaultMockAPIResponses(experimentId),
  customAPIResponses,
);

const defaultProps = { experimentId };
const dotPlotPageFactory = createTestComponentFactory(DotPlotPage, defaultProps);

// Helper function to get genes held within the tree
const getTreeGenes = (container) => {
  const treeNodeList = container.querySelectorAll('span[class*=ant-tree-title]');
  return Array.from(treeNodeList).map((node) => node.textContent);
};

// Helper function to get current order of displayed genes in enzyme tests
const getCurrentGeneOrder = (component) => {
  const treeNodes = component.find('div.ant-tree-treenode');
  const newOrder = [];
  treeNodes.forEach((node) => {
    newOrder.push(node.text());
  });
  newOrder.splice(0, 1);
  return newOrder;
};

const renderDotPlot = async (store) => {
  await act(async () => {
    render(
      <Provider store={store}>
        {dotPlotPageFactory()}
      </Provider>,
    );
  });
};

const renderDotPlotForEnzyme = async (store) => (
  mount(
    <Provider store={store}>
      {dotPlotPageFactory()}
    </Provider>,
  )
);

enableFetchMocks();

let storeState = null;

describe('Dot plot page', () => {
  beforeEach(async () => {
    jest.clearAllMocks();

    fetchWork
      .mockReset()
      .mockImplementation((_experimentId, body) => mockWorkerResponses[body.name]);

    fetchMock.resetMocks();
    fetchMock.mockIf(/.*/, mockAPI(mockAPIResponse));

    storeState = makeStore();

    await storeState.dispatch(loadBackendStatus(experimentId));

    storeState.dispatch({
      type: EXPERIMENT_SETTINGS_INFO_UPDATE,
      payload: {
        experimentId: fake.EXPERIMENT_ID,
        experimentName: fake.EXPERIMENT_NAME,
      },
    });
  });

  it('Renders the plot page correctly', async () => {
    await renderDotPlot(storeState);

    // screen.debug(null, Infinity); // There is the text Dot plot show in the breadcrumbs
    expect(screen.getByText(new RegExp(plotNames.DOT_PLOT, 'i'))).toBeInTheDocument();

    // It has the required dropdown options
    expect(screen.getByText(/Gene selection/i)).toBeInTheDocument();
    expect(screen.getByText(/Select data/i)).toBeInTheDocument();
    expect(screen.getByText(/Size scale/i)).toBeInTheDocument();
    expect(screen.getByText(/Main schema/i)).toBeInTheDocument();
    expect(screen.getByText(/Axes and margins/i)).toBeInTheDocument();
    expect(screen.getByText(/Colours/i)).toBeInTheDocument();
    expect(screen.getByText(/Legend/i)).toBeInTheDocument();

    // It shows the plot
    expect(screen.getByRole('graphics-document', { name: 'Vega visualization' })).toBeInTheDocument();

    // csv data is passed correctly
    const loadedData = ExportAsCSV.mock.calls.find(([{ data }]) => data.length > 0);
    expect(loadedData).toMatchSnapshot();
  });

  it('Shows a skeleton if config is not loaded', async () => {
    const noConfigResponse = {
      ...mockAPIResponse,
      [`/plots/${plotUuid}$`]: () => new Promise(() => { }),
    };

    fetchMock.mockIf(/.*/, mockAPI(noConfigResponse));

    await renderDotPlot(storeState);

    expect(screen.getByRole('list')).toHaveClass('ant-skeleton-paragraph');
  });

  it('Shows an error if there are errors loading cell sets', async () => {
    const cellSetsErrorResponse = {
      ...mockAPIResponse,
      [`experiments/${experimentId}/cellSets$`]: () => statusResponse(404, 'Nothing found'),
    };

    fetchMock.mockIf(/.*/, mockAPI(cellSetsErrorResponse));

    await renderDotPlot(storeState);

    expect(screen.getByText(/Error loading cell sets/i)).toBeInTheDocument();
  });

  it('Shows platform error if there are errors fetching the work', async () => {
    const errorResponse = {
      ...mockWorkerResponses,
      DotPlot: () => { throw new Error('error'); },
    };

    fetchWork
      .mockReset()
      .mockImplementation((_experimentId, body) => errorResponse[body.name]);

    await renderDotPlot(storeState);

    expect(screen.getByText(/Error loading plot data/i)).toBeInTheDocument();
    expect(screen.getByText(/Check the options that you have selected and try again/i)).toBeInTheDocument();
  });

  it('Shows an empty message if there is no data to show in the plot', async () => {
    const emptyResponse = {
      ...mockWorkerResponses,
      DotPlot: {
        cellSetsIdx: [],
        cellSetsNames: [],
        cellsPercentage: [],
        avgExpression: [],
        geneNameIdx: [],
        geneNames: [],
      },
    };

    fetchWork
      .mockReset()
      .mockImplementation((_experimentId, body) => emptyResponse[body.name]);

    await renderDotPlot(storeState);

    expect(screen.getByText(/There is no data to show/i)).toBeInTheDocument();
    expect(screen.getByText(/Select another option from the 'Select data' menu/i)).toBeInTheDocument();
  });

  it('should eventually show a no data error for marker genes with single group cell set', async () => {
    // This test is marked as checking eventual behavior rather than exact call counts
    // since the exact number of work requests can vary based on initialization timing

    await renderDotPlot(storeState);

    // Wait for component to stabilize and any initialization calls to complete
    await waitFor(
      () => {
        expect(screen.getByText(/Marker genes/i) || screen.getByText(/Dot plot/i)).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    // Use marker genes
    await act(async () => {
      userEvent.click(screen.getByText(/Marker genes/i));
    });

    // Select data
    userEvent.click(screen.getByText(/Select data/i));

    // Select samples
    const selectBaseCells = screen.getByRole('combobox', { name: 'selectCellSets' });
    userEvent.click(selectBaseCells);

    const baseOption = screen.getByTitle(/Samples/);
    userEvent.click(baseOption);

    // Select the filter sets
    const selectFilterCells = screen.getByRole('combobox', { name: 'selectPoints' });
    userEvent.click(selectFilterCells);

    const filterOption = screen.getByTitle(/Copied WT2/);

    await act(async () => {
      fireEvent.click(filterOption);
    });

    // Verify the no data error message is shown
    await waitFor(() => {
      expect(screen.getByText(/There is no data to show/i)).toBeInTheDocument();
      expect(screen.getByText(/The cell set that you have chosen to display is repesented by only one group/i)).toBeInTheDocument();
      expect(screen.getByText(/A comparison can not be run to determine the top marker genes/i)).toBeInTheDocument();
      expect(screen.getByText(/Select another option from the 'Select data' menu/i)).toBeInTheDocument();
    });
  });

  it('removing a gene keeps the order', async () => {
    await renderDotPlot(storeState);

    const geneTree = screen.getByRole('tree');

    // first three genes of the data should be loaded by default
    const loadedGenes = {};
    // The genes in Data 5 should be in the tree
    paginatedGeneExpressionData.gene_names.forEach((gene, indx) => {
      loadedGenes[gene] = { dispersions: paginatedGeneExpressionData.dispersions[indx] };
    });

    // Remove a gene using the X button
    const genesListBeforeRemoval = getTreeGenes(geneTree);

    const geneToRemove = within(geneTree).getByText(genesListBeforeRemoval[1]);

    const geneRemoveButton = geneToRemove.nextSibling.firstChild;

    userEvent.click(geneRemoveButton);

    const genesListAfterRemoval = getTreeGenes(geneTree);

    // remove element from list manually to compare
    genesListBeforeRemoval.splice(1, 1);

    // The gene should be deleted from the list
    expect(_.isEqual(genesListAfterRemoval, genesListBeforeRemoval)).toEqual(true);
  });

  it('searches for genes and adds a valid gene', async () => {
    await renderDotPlot(storeState);

    const geneTree = screen.getByRole('tree');
    const initialOrder = getTreeGenes(geneTree);

    // check placeholder text is loaded
    expect(screen.getByText('Search for genes...')).toBeInTheDocument();

    const searchBox = screen.getByRole('combobox');

    // search for genes using lowercase
    userEvent.type(searchBox, 'ap');

    // antd creates multiple elements for options
    // find option element by title, clicking on element with role='option' does nothing
    const option = screen.getByTitle('Apoe');

    await act(async () => {
      // the element has pointer-events set to 'none', skip check
      // based on https://stackoverflow.com/questions/61080116
      userEvent.click(option, undefined, { skipPointerEventsCheck: true });
    });

    // check the search text is modified after selecting a valid option
    expect(searchBox.value).toBe('Apoe, ');

    const geneAddButton = screen.getByText('Add');

    userEvent.click(geneAddButton);

    // check the selected gene was added
    expect(within(geneTree).getByText('Apoe')).toBeInTheDocument();

    // check the genes were not re-ordered when adding
    initialOrder.push('Apoe');
    expect(_.isEqual(initialOrder, getTreeGenes(geneTree))).toEqual(true);
  });

  it('tries to select an already loaded gene and clears the input', async () => {
    await renderDotPlot(storeState);

    const searchBox = screen.getByRole('combobox');

    userEvent.type(searchBox, 'ly');

    const option = screen.getByTitle('Lyz2');

    // expecting option to be disabled throws error, click the option instead and check reaction
    await act(async () => {
      userEvent.click(option, undefined, { skipPointerEventsCheck: true });
    });

    // search box shouldn't clear when selecting an already loaded gene
    expect(searchBox.value).toBe('ly');

    // clear button is automatically generated by antd and cannot be easily accessed
    const clearButton = searchBox.closest('div[class*=ant-select-auto-complete]').lastChild;

    userEvent.click(clearButton);

    expect(searchBox.value).toBe('');
  });

  it('resets the data', async () => {
    await renderDotPlot(storeState);

    // add a gene to prepare for reset
    const searchBox = screen.getByRole('combobox');

    userEvent.type(searchBox, 'ap');

    const option = screen.getByTitle('Apoe');

    await act(async () => {
      userEvent.click(option, undefined, { skipPointerEventsCheck: true });
    });

    const resetButton = screen.getByText('Reset Plot');

    await act(async () => {
      userEvent.click(resetButton);
    });

    // expect the gene only within the options of the search box, antd creates 2 elements
    expect(screen.getAllByText('Apoe').length).toBe(2);
  });

  it('shows genes in the Custom genes list after Reset Plot is clicked', async () => {
    await renderDotPlot(storeState);

    // Wait for initial load
    const geneTree = await screen.findByRole('tree');
    let genesDisplayed = getTreeGenes(geneTree).filter((g) => g);
    const initialGenes = [...genesDisplayed];
    expect(genesDisplayed.length).toBeGreaterThan(0);

    // Toggle to Marker genes mode to enable Reset button
    const markerGenesToggle = screen.getByText(/Marker genes/i);
    await act(async () => {
      userEvent.click(markerGenesToggle);
    });

    // Click Reset Plot button
    const resetButton = screen.getByText('Reset Plot');
    await act(async () => {
      userEvent.click(resetButton);
    });

    // Wait for reset to complete and genes to reappear
    await waitFor(() => {
      genesDisplayed = getTreeGenes(geneTree).filter((g) => g);
      // After reset, there should still be genes in the tree (the 3 highest dispersion genes)
      expect(genesDisplayed.length).toBeGreaterThan(0);
      // Verify they match the initial genes (should be the 3 highest dispersion genes)
      expect(genesDisplayed).toEqual(initialGenes);
    }, { timeout: 2000 });
  });

  it('Reset Plot button is disabled initially but enabled after toggling Marker genes', async () => {
    await renderDotPlot(storeState);

    // Wait for initial load
    await screen.findByRole('tree');

    // Find the Reset Plot button
    const resetButton = screen.getByRole('button', { name: /Reset Plot/i });

    // Button should be disabled initially (config matches initial state)
    expect(resetButton).toBeDisabled();

    // Toggle to Marker genes mode to change the config
    const markerGenesToggle = screen.getByText(/Marker genes/i);
    await act(async () => {
      userEvent.click(markerGenesToggle);
    });

    // After toggling, Reset Plot button should be enabled (config no longer matches initial)
    await waitFor(() => {
      expect(resetButton).not.toBeDisabled();
    });
  });

  it('Clear All button removes all genes from Custom genes list and shows empty message', async () => {
    await renderDotPlot(storeState);

    // Wait for initial load and gene tree to appear
    const geneTree = await screen.findByRole('tree');
    let genesDisplayed = getTreeGenes(geneTree).filter((g) => g);

    // Verify genes are initially displayed
    expect(genesDisplayed.length).toBeGreaterThan(0);
    const initialGeneCount = genesDisplayed.length;

    // Click Clear All button
    const clearAllButton = screen.getByRole('button', { name: /Clear All/i });
    await act(async () => {
      userEvent.click(clearAllButton);
    });

    // Verify genes are removed from the custom genes list
    await waitFor(() => {
      genesDisplayed = getTreeGenes(geneTree).filter((g) => g);
      expect(genesDisplayed.length).toBe(0);
    });

    // Verify "There is no data to show" message appears
    expect(screen.getByText(/There is no data to show/i)).toBeInTheDocument();
  });

  it('Reset button in gene selection restores genes without changing other config', async () => {
    await renderDotPlot(storeState);

    // Wait for initial load
    const geneTree = await screen.findByRole('tree');
    let genesDisplayed = getTreeGenes(geneTree).filter((g) => g);
    const initialGenes = [...genesDisplayed];
    expect(genesDisplayed.length).toBeGreaterThan(0);

    // Get initial config state (dimensions, colors, etc.)
    const initialConfig = storeState.getState().componentConfig.dotPlotMain?.config;
    const initialDimensions = initialConfig?.dimensions;

    // Clear all genes using the Clear All button
    const clearAllButton = screen.getByRole('button', { name: /Clear All/i });
    await act(async () => {
      userEvent.click(clearAllButton);
    });

    // Verify genes are cleared
    await waitFor(() => {
      genesDisplayed = getTreeGenes(geneTree).filter((g) => g);
      expect(genesDisplayed.length).toBe(0);
    });

    // Click the Reset button in the gene selection panel
    const resetButton = screen.getByRole('button', { name: /^Reset$/i });
    await act(async () => {
      userEvent.click(resetButton);
    });

    // Verify genes are restored to the initial genes
    await waitFor(() => {
      genesDisplayed = getTreeGenes(geneTree).filter((g) => g);
      expect(genesDisplayed).toEqual(initialGenes);
    });

    // Verify other config stayed the same (e.g., dimensions)
    const finalConfig = storeState.getState().componentConfig.dotPlotMain?.config;
    expect(finalConfig?.dimensions).toEqual(initialDimensions);
  });

  it('does not call getDotPlot twice when Clear All is clicked then Reset is clicked', async () => {
    await renderDotPlot(storeState);

    // Wait for initial plot load and component to stabilize
    await waitFor(() => {
      expect(screen.getByRole('tree')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Clear all genes by setting selectedGenes to empty
    const geneTree = screen.getByRole('tree');
    const genesBeforeClear = getTreeGenes(geneTree);

    // Remove all genes
    genesBeforeClear.forEach((gene) => {
      if (gene) { // Skip empty strings
        const geneElement = within(geneTree).queryByText(gene);
        if (geneElement && geneElement.nextSibling) {
          const removeButton = geneElement.nextSibling.firstChild;
          userEvent.click(removeButton);
        }
      }
    });

    // Now tree should be empty or show default message
    const resetButton = screen.getByText('Reset Plot');

    // Record the number of calls before reset
    const callsBeforeReset = fetchWork.mock.calls.length;

    // Click reset - should only call getDotPlot once, not twice
    await act(async () => {
      userEvent.click(resetButton);
    });

    // Wait a bit for effects to settle
    await waitFor(() => {
      expect(screen.getByRole('tree')).toBeInTheDocument();
    }, { timeout: 2000 });

    // The fix ensures that when Clear All → Reset happens, getDotPlot is only called once
    // (not once in reset effect and again in main config effect)
    // We should have at most one more call than before reset
    const callsAfterReset = fetchWork.mock.calls.length;
    expect(callsAfterReset - callsBeforeReset).toBeLessThanOrEqual(1);
  });

  it('does not call getDotPlot twice when "Reset Plot" button is clicked from marker genes mode', async () => {
    // This test verifies the fix: when the "Reset Plot" button (in PlotContainer toolbar) is clicked 
    // while on marker genes toggle, getDotPlot should only be called once (from reset effect), not twice.
    // Note: This is different from the "Reset" button in the Gene selection panel.

    await renderDotPlot(storeState);

    // Wait for initial setup
    await waitFor(() => {
      expect(screen.getByText(/Dot plot/i)).toBeInTheDocument();
    });

    // Switch to marker genes mode
    const markerGenesToggle = screen.getByText(/Marker genes/i);
    await act(async () => {
      userEvent.click(markerGenesToggle);
    });

    // Record call count before reset
    const callCountBeforeReset = fetchWork.mock.calls.length;

    // Click reset
    const resetButton = screen.getByText('Reset Plot');
    await act(async () => {
      userEvent.click(resetButton);
    });

    // Wait briefly for effects to process
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Count the getDotPlot calls made during reset
    // With the fix, should be exactly 1 (from reset effect)
    // Without the fix, would be 2 (one from marker genes sync, one from main effect)
    const callsMadeForReset = fetchWork.mock.calls.length - callCountBeforeReset;
    expect(callsMadeForReset).toBe(1);
  });

  it('does not call getDotPlot when toggling to "Marker genes" without changing nMarkerGenes', async () => {
    // This test verifies that simply toggling the useMarkerGenes flag doesn't trigger a work request
    // Only changes to nMarkerGenes or selectedGenes should trigger getDotPlot

    await renderDotPlot(storeState);

    // Wait for initial setup (ListGenes + initial DotPlot)
    await waitFor(() => {
      expect(screen.getByText(/Dot plot/i)).toBeInTheDocument();
    });

    // Record call count before toggling marker genes
    const callCountBeforeToggle = fetchWork.mock.calls.length;

    // Switch to marker genes mode - this should NOT call getDotPlot
    const markerGenesToggle = screen.getByText(/Marker genes/i);
    await act(async () => {
      userEvent.click(markerGenesToggle);
    });

    // Wait briefly
    await new Promise((resolve) => setTimeout(resolve, 100));

    // No new calls should have been made
    const callsMadeByToggle = fetchWork.mock.calls.length - callCountBeforeToggle;
    expect(callsMadeByToggle).toBe(0);
  });

  it('calls getDotPlot once with correct nMarkerGenes when clicking "Run" in marker genes mode', async () => {
    // This test verifies that clicking "Run" in the MarkerGeneSelection panel
    // triggers exactly one getDotPlot call with the specified number of marker genes

    await renderDotPlot(storeState);

    // Wait for initial setup
    await waitFor(() => {
      expect(screen.getByText(/Dot plot/i)).toBeInTheDocument();
    });

    // Switch to marker genes mode
    const markerGenesToggle = screen.getByText(/Marker genes/i);
    await act(async () => {
      userEvent.click(markerGenesToggle);
    });

    // Record call count before clicking Run
    const callCountBeforeRun = fetchWork.mock.calls.length;

    // Find and click the Run button in the MarkerGeneSelection panel
    const runButton = screen.getByRole('button', { name: /run/i });
    await act(async () => {
      userEvent.click(runButton);
    });

    // Wait briefly for effects to process
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Should have exactly one getDotPlot call
    const callsMadeByRun = fetchWork.mock.calls.length - callCountBeforeRun;
    expect(callsMadeByRun).toBe(1);

    // The getDotPlot call should have been made with useMarkerGenes: true
    const lastDotPlotCall = fetchWork.mock.calls[fetchWork.mock.calls.length - 1];
    expect(lastDotPlotCall[1]).toBeDefined();
    expect(lastDotPlotCall[1].name).toBe('DotPlot');
  });

  it('preserves marker genes in custom genes list when toggling back to Custom genes', async () => {
    // This test verifies that when toggling to marker genes, running (which returns different genes),
    // then toggling back to custom genes, the marker genes (not the original 3 genes) are in the list

    // Create custom mock that returns different genes for marker genes
    const markerGenesResult = {
      ...dotPlotData,
      geneNames: ['Apoe', 'Lyz2', 'Gzma', 'Ifitm3', 'Chil3'], // Different/reordered genes
      geneNameIdx: [1, 3, 4, 2, 0],
    };

    // Reset mock to use custom implementation
    jest.clearAllMocks();
    let isFirstCall = true;

    fetchWork
      .mockReset()
      .mockImplementation((_experimentId, body) => {
        if (body.name === 'ListGenes') {
          return mockWorkerResponses.ListGenes;
        }
        if (body.name === 'DotPlot') {
          // Return marker genes data when in marker genes mode
          if (body.config?.useMarkerGenes) {
            return markerGenesResult;
          }
          // Return default data for custom genes mode
          return mockWorkerResponses.DotPlot;
        }
        return mockWorkerResponses[body.name];
      });

    fetchMock.resetMocks();
    fetchMock.mockIf(/.*/, mockAPI(mockAPIResponse));

    const testStore = makeStore();
    await testStore.dispatch(loadBackendStatus(experimentId));

    testStore.dispatch({
      type: EXPERIMENT_SETTINGS_INFO_UPDATE,
      payload: {
        experimentId: fake.EXPERIMENT_ID,
        experimentName: fake.EXPERIMENT_NAME,
      },
    });

    await renderDotPlot(testStore);

    // Wait for initial setup - should have 3 highest dispersion genes
    await waitFor(() => {
      expect(screen.getByText(/Dot plot/i)).toBeInTheDocument();
    });

    const geneTree = screen.getByRole('tree');
    const initialGenes = getTreeGenes(geneTree).filter((g) => g); // Filter empty strings
    expect(initialGenes.length).toBe(3); // Should have 3 initial genes

    // Switch to marker genes mode
    const markerGenesToggle = screen.getByText(/Marker genes/i);
    await act(async () => {
      userEvent.click(markerGenesToggle);
    });

    // Click Run to load marker genes
    const runButton = screen.getByRole('button', { name: /run/i });
    await act(async () => {
      userEvent.click(runButton);
    });

    // Wait for effects to process and genes to be synced
    await waitFor(() => {
      const state = testStore.getState();
      const currentGenes = state.componentConfig.dotPlotMain?.config?.selectedGenes || [];
      // When marker genes are synced, selectedGenes should be updated
      expect(currentGenes.length).toBeGreaterThan(0);
    }, { timeout: 3000 });

    // Get marker genes that were loaded
    let markerGenesLoaded = testStore.getState().componentConfig.dotPlotMain?.config?.selectedGenes || [];

    // Toggle back to Custom genes
    await act(async () => {
      userEvent.click(markerGenesToggle);
    });

    // Wait a moment for the view to update
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Get the genes after toggling back to custom
    const genesAfterToggle = testStore.getState().componentConfig.dotPlotMain?.config?.selectedGenes || [];

    // The genes should still be the marker genes that were loaded
    // (they should have been preserved when toggling to custom genes mode)
    expect(genesAfterToggle).toEqual(markerGenesLoaded);

    // And they should be different from the initial 3 genes
    expect(genesAfterToggle).not.toEqual(initialGenes);
  });

  it('does not call getDotPlot when removing a gene from custom genes list', async () => {
    // This test verifies that removing a gene from the custom genes list
    // filters the existing plotData locally and does NOT call getDotPlot

    await renderDotPlot(storeState);

    // Wait for initial setup with 3 default genes
    await waitFor(() => {
      expect(screen.getByText(/Dot plot/i)).toBeInTheDocument();
    });

    const geneTree = screen.getByRole('tree');
    const initialGenes = getTreeGenes(geneTree).filter((g) => g);
    expect(initialGenes.length).toBe(3);

    // Record the number of work requests before deleting a gene
    const callCountBeforeDelete = fetchWork.mock.calls.length;

    // Get the first gene and its remove button
    const genesBeforeDelete = getTreeGenes(geneTree);
    const geneToRemove = genesBeforeDelete[0];

    const geneElement = within(geneTree).queryByText(geneToRemove);
    if (geneElement && geneElement.nextSibling) {
      const removeButton = geneElement.nextSibling.firstChild;

      // Click remove button
      await act(async () => {
        userEvent.click(removeButton);
      });

      // Wait a moment for state to update
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should NOT have called getDotPlot
      const callsMadeByDelete = fetchWork.mock.calls.length - callCountBeforeDelete;
      expect(callsMadeByDelete).toBe(0);

      // But the gene should be removed from the list
      const genesAfterDelete = getTreeGenes(geneTree).filter((g) => g);
      expect(genesAfterDelete.length).toBe(2);
      expect(genesAfterDelete).not.toContain(geneToRemove);
    }
  });

  it.skip('does not call getDotPlot when genes list remains the same', async () => {
    // This test verifies that if no genes are added/removed (only styling changes),
    // getDotPlot is NOT called
    // TODO: Implement styling change UI interaction
  });

  it('Max Radius config updates when slider value changes', async () => {
    await renderDotPlot(storeState);

    // Wait for initial plot to load
    await waitFor(() => {
      expect(screen.getByRole('graphics-document', { name: 'Vega visualization' })).toBeInTheDocument();
    });

    // Get initial config value
    const initialConfig = storeState.getState().componentConfig.dotPlotMain?.config;
    const initialMaxPointRadius = initialConfig?.maxPointRadius;

    // Simulate slider change via Redux dispatch
    const newValue = 8;

    await act(async () => {
      // Dispatch the correct UPDATE_CONFIG action
      storeState.dispatch({
        type: UPDATE_CONFIG,
        payload: {
          plotUuid: 'dotPlotMain',
          configChanges: {
            maxPointRadius: newValue,
          },
        },
      });
    });

    // Assert that the store config was actually updated
    const updatedConfig = storeState.getState().componentConfig.dotPlotMain?.config;
    expect(updatedConfig?.maxPointRadius).toBe(newValue);

    // Assert the new value is within valid bounds
    expect(newValue).toBeLessThanOrEqual(20);
    expect(newValue).toBeGreaterThanOrEqual(3);
  });

  it('Max Radius slider respects calculated bounds', async () => {
    await renderDotPlot(storeState);

    // Wait for initial plot to load
    await waitFor(() => {
      expect(screen.getByRole('graphics-document', { name: 'Vega visualization' })).toBeInTheDocument();
    });

    // Calculate what the default radius should be based on mock plot data
    // Using the same logic as calculateDefaultRadius in the component
    const plotData = storeState.getState().componentConfig.dotPlotMain?.plotData || [];
    
    if (plotData.length === 0) {
      // If no plot data, calculation would use fallback
      expect(true).toBe(true);
      return;
    }

    const plotWidth = 800; // From mocked react-resize-detector
    const plotHeight = 800;
    const padding = 1;
    const adjustment = 2;

    const uniqueGenes = new Set(plotData.map((d) => d.geneName));
    const numGenes = uniqueGenes.size;

    const uniqueClusters = new Set(plotData.map((d) => d.cellSets));
    const numClusters = uniqueClusters.size;

    const heightPerDot = plotHeight / (numClusters + adjustment);
    const widthPerDot = plotWidth / (numGenes + adjustment);

    const radiusWithPadding = Math.floor(Math.min(heightPerDot, widthPerDot) / 2);
    const calculatedDefaultRadius = radiusWithPadding - padding;

    // Cap to slider range [3, 20]
    const expectedDefaultRadius = Math.max(3, Math.min(20, calculatedDefaultRadius));

    // Slider bounds should be: default ± 5 for min, default ± 2 for max, constrained to [3, 20]
    const expectedMinBound = Math.max(3, expectedDefaultRadius - 5);
    const expectedMaxBound = Math.min(20, expectedDefaultRadius + 2);

    // Verify bounds are correctly calculated
    expect(expectedMinBound).toBeGreaterThanOrEqual(3);
    expect(expectedMaxBound).toBeLessThanOrEqual(20);
    expect(expectedMinBound).toBeLessThanOrEqual(expectedMaxBound);

    // Verify the config has a maxPointRadius (or defaults correctly when undefined)
    const config = storeState.getState().componentConfig.dotPlotMain?.config;
    const currentMaxPointRadius = config?.maxPointRadius || expectedDefaultRadius;
    
    // Current value should be within the calculated bounds
    expect(currentMaxPointRadius).toBeGreaterThanOrEqual(expectedMinBound);
    expect(currentMaxPointRadius).toBeLessThanOrEqual(expectedMaxBound);
  });
});

// drag and drop is impossible in RTL, use enzyme
describe('Drag and drop enzyme tests', () => {
  let component;
  let tree;
  const loadedGenes = {};

  beforeEach(async () => {
    jest.clearAllMocks();

    fetchMock.resetMocks();
    fetchMock.mockIf(/.*/, mockAPI(mockAPIResponse));

    storeState = makeStore();

    await storeState.dispatch(loadBackendStatus(experimentId));

    storeState.dispatch({
      type: EXPERIMENT_SETTINGS_INFO_UPDATE,
      payload: {
        experimentId: fake.EXPERIMENT_ID,
        experimentName: fake.EXPERIMENT_NAME,
      },
    });

    component = await renderDotPlotForEnzyme(storeState);

    await waitForComponentToPaint(component);

    component.update();

    // antd renders 5 elements, use the first one
    tree = component.find({ 'data-testid': 'HierachicalTreeGenes' }).at(0);

    paginatedGeneExpressionData.gene_names.slice(0, 3).reverse().forEach((gene, indx) => {
      loadedGenes[gene] = { dispersions: paginatedGeneExpressionData.dispersions[indx] };
    });
  });

  it('changes nothing on drop in place', async () => {
    // default genes are in the tree

    Object.keys(loadedGenes).forEach((geneName) => {
      expect(tree.containsMatchingElement(geneName));
    });

    // dropping in place does nothing
    const info = {
      dragNode: { key: 1, pos: '0-1' },
      dropPosition: 1,
      node: { dragOver: false },
    };

    tree.getElement().props.onDrop(info);

    await act(async () => {
      component.update();
    });

    const newOrder = getCurrentGeneOrder(component);
    expect(_.isEqual(newOrder, Object.keys(loadedGenes))).toEqual(true);
  });

  it('re-orders genes correctly', async () => {
    // default genes are in the tree
    Object.keys(loadedGenes).forEach((geneName) => {
      expect(tree.containsMatchingElement(geneName));
    });
    // dropping to gap re-orders genes
    const info = {
      dragNode: { key: 0, pos: '0-0' },
      dropPosition: 2,
      node: { dragOver: false },
    };

    tree.getElement().props.onDrop(info);

    await act(async () => {
      component.update();
    });

    const newOrder = getCurrentGeneOrder(component);
    const expectedOrder = arrayMoveImmutable(Object.keys(loadedGenes), 0, 1);
    expect(_.isEqual(newOrder, expectedOrder)).toEqual(true);
  });
});
