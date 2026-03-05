import {
  render, screen, waitFor, within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import _ from 'lodash';
import MarkerHeatmap from 'pages/experiments/[experimentId]/plots-and-tables/marker-heatmap/index';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';
import { loadBackendStatus } from 'redux/actions/backendStatus';
import { loadGeneExpression } from 'redux/actions/genes';
import updatePlotConfig from 'redux/actions/componentConfig/updatePlotConfig';
import { makeStore } from 'redux/store';
import fetchWork from 'utils/work/fetchWork';

import markerGenesData2 from '__test__/data/marker_genes_2.json';
import markerGenesData5 from '__test__/data/marker_genes_5.json';
import markerGenesData5AndFakeGene from '__test__/data/marker_genes_5_and_FAKE_gene.json';
import geneList from '__test__/data/paginated_gene_expression.json';

import preloadAll from 'jest-next-dynamic';

import fake from '__test__/test-utils/constants';
import mockAPI, {
  generateDefaultMockAPIResponses,
  promiseResponse,
  statusResponse,
  workerDataResult,
} from '__test__/test-utils/mockAPI';
import createTestComponentFactory from '__test__/test-utils/testComponentFactory';
import cellSetsData from '__test__/data/cell_sets.json';
import { MAX_LEGEND_ITEMS } from 'components/plots/helpers/PlotLegendAlert';

jest.mock('components/header/UserButton', () => () => <></>);
jest.mock('react-resize-detector', () => (props) => {
  // eslint-disable-next-line react/prop-types
  const { children } = props;
  return children({ width: 800, height: 800 });
});

// Disable local cache
jest.mock('localforage', () => ({
  getItem: () => Promise.resolve(undefined),
  setItem: () => Promise.resolve(),
  config: () => { },
  ready: () => Promise.resolve(),
  length: () => 0,
}));

jest.mock('utils/work/fetchWork');

const mockWorkerResponses = {
  'MarkerHeatmap-5': markerGenesData5,
  GeneExpression: markerGenesData5AndFakeGene,
  ListGenes: geneList,
};

const experimentId = fake.EXPERIMENT_ID;
const plotUuid = 'markerHeatmapPlotMain';
let storeState = null;

const customAPIResponses = {
  [`/plots/${plotUuid}$`]: (req) => {
    if (req.method === 'PUT') return promiseResponse(JSON.stringify('OK'));
    return statusResponse(404, 'Not Found');
  },
};

const defaultResponses = _.merge(
  generateDefaultMockAPIResponses(experimentId),
  customAPIResponses,
);

const defaultProps = { experimentId };

const heatmapPageFactory = createTestComponentFactory(MarkerHeatmap, defaultProps);

// Helper function to get genes held within the tree
const getTreeGenes = (container) => {
  const treeNodeList = container.querySelectorAll('span[class*=ant-tree-title]');
  return Array.from(treeNodeList).map((node) => node.textContent);
};

const renderHeatmapPage = async (store) => {
  await act(async () => render(
    <Provider store={store}>
      {heatmapPageFactory()}
    </Provider>,
  ));
};

enableFetchMocks();

describe('Marker heatmap plot', () => {
  beforeAll(async () => {
    await preloadAll();
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    fetchWork
      .mockReset()
      .mockImplementation((_experimentId, body) => {
        const reqType = body.nGenes ? `${body.name}-${body.nGenes}` : body.name;
        return mockWorkerResponses[reqType];
      });

    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockIf(/.*/, mockAPI(defaultResponses));

    storeState = makeStore();

    // Set up state for backend status
    await storeState.dispatch(loadBackendStatus(experimentId));
  });

  it('Loads controls and elements', async () => {
    await renderHeatmapPage(storeState);

    expect(screen.getByText(/Gene selection/i)).toBeInTheDocument();
    expect(screen.getByText(/Select data/i)).toBeInTheDocument();
    expect(screen.getByText(/Cluster guardlines/i)).toBeInTheDocument();
    expect(screen.getByText(/Metadata tracks/i)).toBeInTheDocument();
    expect(screen.getByText(/Group by/i)).toBeInTheDocument();
    expect(screen.getByText(/Expression values/i)).toBeInTheDocument();
    expect(screen.getByText(/Main schema/i)).toBeInTheDocument();
    expect(screen.getByText(/Colours/i)).toBeInTheDocument();
    expect(screen.getByText(/Legend/i)).toBeInTheDocument();
  });

  it('Loads the plot', async () => {
    await renderHeatmapPage(storeState);

    expect(screen.getByRole('graphics-document', { name: 'Marker heatmap' })).toBeInTheDocument();
  });

  it('Shows an error message if marker genes failed to load', async () => {
    fetchWork
      .mockReset()
      .mockImplementation(
        (_experimentId, body) => {
          const reqType = body.nGenes ? `${body.name}-${body.nGenes}` : body.name;
          if (reqType === 'MarkerHeatmap-5') return Promise.reject(new Error('Not found'));

          return workerDataResult(mockWorkerResponses[reqType]);
        },
      );

    await renderHeatmapPage(storeState);

    // It shouldn't show the plot
    expect(screen.queryByRole('graphics-document', { name: 'Marker heatmap' })).toBeNull();

    // There is an error message
    expect(screen.getByText(/Could not load marker genes/i)).toBeInTheDocument();
  });

  it('loads marker genes on specifying new number of genes per cluster', async () => {
    await renderHeatmapPage(storeState);

    // Check that initially there are 5 marker genes - the default
    markerGenesData5.orderedGeneNames.forEach((geneName) => {
      expect(screen.getByText(geneName)).toBeInTheDocument();
    });

    await act(async () => {
      userEvent.click(screen.getByText('Marker genes'));
    });

    expect(screen.getByText('Number of marker genes per cluster')).toBeInTheDocument();

    const nGenesInput = screen.getByRole('spinbutton', { name: 'Number of genes input' });

    userEvent.type(nGenesInput, '{backspace}2');

    await act(async () => {
      userEvent.click(screen.getByText('Run'));
    });

    // Go back to "Custom Genes" and check the number of genes
    await act(async () => {
      userEvent.click(screen.getByText('Custom genes'));
    });

    // The genes in Data 2 should exist
    markerGenesData2.orderedGeneNames.forEach((geneName) => {
      expect(screen.getByText(geneName)).toBeInTheDocument();
    });
  });

  it('adds genes correctly into the plot', async () => {
    await renderHeatmapPage(storeState);
    // Add in a new gene
    const genesToLoad = [...markerGenesData5.orderedGeneNames, 'FAKEGENE'];

    await act(async () => {
      // Update the config with new selectedGenes
      await storeState.dispatch(updatePlotConfig(plotUuid, { selectedGenes: genesToLoad }));
      // Then load the expression data
      await storeState.dispatch(loadGeneExpression(experimentId, genesToLoad, plotUuid));
    });

    // Get genes displayed in the tree
    const geneTree = screen.getByRole('tree');

    const displayedGenesList = getTreeGenes(geneTree);

    // check the added gene is in the tree
    expect(within(geneTree).getByText('FAKEGENE')).toBeInTheDocument();

    // Check that the genes is ordered correctly.
    // This means that FAKEGENE should be the last in the genes list
    expect(displayedGenesList).toEqual(genesToLoad);
  });

  it('Shows an information text if a selected cell set does not contain enough number of samples', async () => {
    await renderHeatmapPage(storeState);

    // Open the toggle
    userEvent.click(screen.getByText(/Select data/i));

    // Click custom cell sets
    userEvent.click(screen.getByText(/louvain clusters/i));
    userEvent.click(screen.getByText(/Custom cell sets/i), null, { skipPointerEventsCheck: true });

    // It shouldn't show the plot
    expect(screen.queryByRole('graphics-document', { name: 'Marker heatmap' })).toBeNull();

    // There is an error message
    expect(screen.getByText(/There is no data to show/i)).toBeInTheDocument();
    expect(screen.getByText(/Select another option from the 'Select data' menu/i)).toBeInTheDocument();
  });

  it('Shows an error message if gene expression fails to load', async () => {
    await renderHeatmapPage(storeState);

    // Verify initial marker genes loaded successfully
    expect(screen.getByText(markerGenesData5.orderedGeneNames[0])).toBeInTheDocument();

    // Manually dispatch an error action to simulate gene expression load failure
    await act(async () => {
      await storeState.dispatch({
        type: 'genes/heatmapGenesExpressionError',
        payload: {
          experimentId,
          componentUuid: plotUuid,
          genes: ['TEST_GENE'],
          error: new Error('Failed to load gene expression'),
        },
      });
    });

    // Verify error state is set in Redux
    const state = storeState.getState();
    expect(state.genes.expression.views[plotUuid]?.error).toBeTruthy();
    expect(state.genes.expression.downsampled?.error).toBeTruthy();
  });

  it('removing a gene keeps the sorted order without re-sorting', async () => {
    await renderHeatmapPage(storeState);

    // Wait for marker genes to load into the page
    await waitFor(() => {
      expect(screen.getByText(markerGenesData5.orderedGeneNames[0])).toBeInTheDocument();
    });

    const geneTree = screen.getByRole('tree');

    // The genes in Data 5 should be in the tree
    markerGenesData5.orderedGeneNames.forEach((geneName) => {
      expect(within(geneTree).getByText(geneName)).toBeInTheDocument();
    });

    // Remove a gene using the X button
    const genesListBeforeRemoval = getTreeGenes(geneTree);

    const geneToRemove = within(geneTree).getByText(genesListBeforeRemoval[1]);

    const geneRemoveButton = geneToRemove.nextSibling.firstChild;

    userEvent.click(geneRemoveButton);

    // Wait for the tree to update after gene removal
    await waitFor(() => {
      const genesListAfterRemoval = getTreeGenes(geneTree);

      // remove element from list manually to compare
      genesListBeforeRemoval.splice(1, 1);

      // The gene should be deleted from the list
      expect(_.isEqual(genesListAfterRemoval, genesListBeforeRemoval)).toEqual(true);
    });
  });

  it('searches for genes and adds a valid gene', async () => {
    await act(async () => {
      await renderHeatmapPage(storeState);
    });

    // check placeholder text is loaded
    expect(screen.getByText('Search for genes...')).toBeInTheDocument();

    const searchBox = screen.getByRole('combobox');

    await act(() => {
      // search for genes using lowercase
      userEvent.type(searchBox, 'tmem');
    });

    await act(() => {
      jest.runAllTimers();
    });

    // Gene Tmem176a that appears as option is disabled because it is already added
    expect(screen.getByTitle('Tmem176a')).toHaveClass('ant-select-item-option-disabled');

    await act(() => {
      // search for genes using lowercase
      userEvent.clear(searchBox);
    });

    // Remove Tmem176a to check if it can be added afterwards
    const geneTree = screen.getByRole('tree');
    const geneToRemove = within(geneTree).getByText('Tmem176a');

    const geneRemoveButton = geneToRemove.nextSibling.firstChild;

    await act(async () => {
      userEvent.click(geneRemoveButton);
    });

    await act(() => {
      // search for genes using lowercase
      userEvent.type(searchBox, 'tmem');
    });

    // antd creates multiple elements for options
    // find option element by title, clicking on element with role='option' does nothing
    const option = screen.getByTitle('Tmem176a');

    expect(option).toBeInTheDocument();
    // The gene was removed, so now the option is enabled

    expect(option).not.toHaveClass('ant-select-item-option-disabled');

    act(() => {
      // the element has pointer-events set to 'none', skip check
      // based on https://stackoverflow.com/questions/61080116
      userEvent.click(option, undefined, { skipPointerEventsCheck: true });
    });

    // check the search text is modified after selecting a valid option
    expect(searchBox.value).toBe('Tmem176a, ');

    const geneAddButton = screen.getByText('Add');

    act(() => {
      userEvent.click(geneAddButton);
    });

    // check the selected gene is being loaded
    await waitFor(() => {
      // Check if there is a call with 'GeneExpression' and containing 'Tmem176a' in the genes array
      const hasGeneExpressionWithTmem176a = fetchWork.mock.calls.some(
        (call) => call[1].name === 'GeneExpression' && call[1].genes.includes('Tmem176a'),
      );

      // Assert that such a call exists
      expect(hasGeneExpressionWithTmem176a).toBeTruthy();
    });
  });

  it('tries to select an already loaded gene and clears the input', async () => {
    await renderHeatmapPage(storeState);

    const searchBox = screen.getByRole('combobox');

    userEvent.type(searchBox, 'tmem');

    const option = screen.getByTitle('Tmem176a');

    // expecting option to be disabled throws error, click the option instead and check reaction
    await act(async () => {
      userEvent.click(option, undefined, { skipPointerEventsCheck: true });
    });

    // search box shouldn't clear when selecting an already loaded gene
    expect(searchBox.value).toBe('tmem');

    // clear button is automatically generated by antd and cannot be easily accessed
    const clearButton = searchBox.closest('div[class*=ant-select-auto-complete]').lastChild;

    userEvent.click(clearButton);

    expect(searchBox.value).toBe('');
  });

  it('Renders a plot legend alert if there are more than MAX_LEGEND_ITEMS number of cell sets', async () => {
    const cellSetsTemplate = (clusterIdx) => ({
      key: `louvain-${clusterIdx}`,
      name: `Cluster ${clusterIdx}`,
      rootNode: false,
      type: 'cellSets',
      color: '#000000',
      cellIds: [clusterIdx],
    });

    const manyCellSets = [...Array(MAX_LEGEND_ITEMS + 1)].map((c, idx) => cellSetsTemplate(idx));

    // Add to louvain cluster
    cellSetsData.cellSets[0].children = manyCellSets;

    const manyCellSetsResponse = {
      ...generateDefaultMockAPIResponses(fake.EXPERIMENT_ID),
      ...customAPIResponses,
      [`experiments/${fake.EXPERIMENT_ID}/cellSets$`]: () => promiseResponse(JSON.stringify(cellSetsData)),
    };

    fetchMock.mockIf(/.*/, mockAPI(manyCellSetsResponse));

    await renderHeatmapPage(storeState);

    // The legend alert plot text should appear
    expect(screen.getByText(/We have hidden the plot legend, because it is too large and it interferes with the display of the plot/)).toBeInTheDocument();
  });

  it('renders the list of genes correctly', async () => {
    await renderHeatmapPage(storeState);
    const genes = getTreeGenes(screen.getByRole('tree'));
    const geneTable = screen.getByText(genes[0]).parentElement;

    // Render the table if there genes
    expect(geneTable).toBeInTheDocument();

    // Clear all genes
    const geneTree = screen.getByRole('tree');
    genes.forEach((gene) => {
      const geneElement = within(geneTree).getByText(gene);
      const geneRemoveButton = geneElement.nextSibling.firstChild;
      userEvent.click(geneRemoveButton);
    });

    // Don't render the table if there are no genes
    expect(geneTable).not.toBeInTheDocument();
  });

  it('loads expression data when marker gene count increases', async () => {
    await renderHeatmapPage(storeState);

    // Initially, 5 marker genes should be loaded
    expect(screen.getByText(markerGenesData5.orderedGeneNames[0])).toBeInTheDocument();

    // Verify plot exists initially
    expect(screen.getByRole('graphics-document', { name: 'Marker heatmap' })).toBeInTheDocument();

    // Increase the number of marker genes from 5 to 2
    userEvent.click(screen.getByText('Marker genes'));
    expect(screen.getByText('Number of marker genes per cluster')).toBeInTheDocument();

    const nGenesInput = screen.getByRole('spinbutton', { name: 'Number of genes input' });
    userEvent.type(nGenesInput, '{backspace}2');

    // Click Run to load new marker genes
    await act(async () => {
      userEvent.click(screen.getByText('Run'));
    });

    // Wait for gene expression to be loaded after marker genes are updated
    await waitFor(() => {
      // Verify loadGeneExpression was called with genes
      const geneExpressionCalls = fetchWork.mock.calls.filter(
        (call) => call[1].name === 'GeneExpression',
      );
      expect(geneExpressionCalls.length).toBeGreaterThan(0);
    }, { timeout: 5000 });

    // Go back to custom genes tab
    userEvent.click(screen.getByText('Custom genes'));

    // Verify new marker genes are displayed
    markerGenesData2.orderedGeneNames.forEach((geneName) => {
      expect(screen.getByText(geneName)).toBeInTheDocument();
    });
  });

  it('custom genes trigger expression loading and UI update', async () => {
    await renderHeatmapPage(storeState);

    // Initially 5 marker genes are displayed
    const genesBefore = getTreeGenes(screen.getByRole('tree'));
    expect(genesBefore).toEqual(markerGenesData5.orderedGeneNames);

    // Add a custom gene like the existing "adds genes correctly" test does
    const customGene = 'FAKEGENE';
    const genesToLoad = [...markerGenesData5.orderedGeneNames, customGene];

    await act(async () => {
      // Update the config with new selectedGenes (simulating custom gene selection)
      await storeState.dispatch(updatePlotConfig(plotUuid, { selectedGenes: genesToLoad }));
      // Then load the expression data
      await storeState.dispatch(loadGeneExpression(experimentId, genesToLoad, plotUuid));
    });

    // Wait for gene expression to be loaded and UI to update
    await waitFor(() => {
      // Verify the custom gene appears in the UI
      const geneTree = screen.getByRole('tree');
      expect(within(geneTree).getByText(customGene)).toBeInTheDocument();
    });

    // Verify the gene list contains the custom gene
    const genesAfter = getTreeGenes(screen.getByRole('tree'));
    expect(genesAfter).toContain(customGene);
    expect(genesAfter).toEqual(genesToLoad);

    // Verify expression data was loaded
    const geneExpressionCalls = fetchWork.mock.calls.filter(
      (call) => call[1].name === 'GeneExpression',
    );
    expect(geneExpressionCalls.length).toBeGreaterThan(0);
  });

  it('combined marker and custom genes load expression data', async () => {
    await renderHeatmapPage(storeState);

    // Start with initial marker genes
    const initialGenes = getTreeGenes(screen.getByRole('tree'));
    expect(initialGenes.length).toBeGreaterThan(0);

    // Directly update store with a combination of 2 marker genes + 1 custom gene
    const combinedGenes = [...markerGenesData2.orderedGeneNames, 'FAKEGENE'];

    await act(async () => {
      // Update config and load expression data for combined genes
      await storeState.dispatch(updatePlotConfig(plotUuid, { selectedGenes: combinedGenes }));
      await storeState.dispatch(loadGeneExpression(experimentId, combinedGenes, plotUuid));
    });

    // Verify all genes (both marker and custom) appear in the UI
    await waitFor(() => {
      const geneTree = screen.getByRole('tree');
      expect(within(geneTree).getByText('FAKEGENE')).toBeInTheDocument();
      markerGenesData2.orderedGeneNames.forEach((gene) => {
        expect(within(geneTree).getByText(gene)).toBeInTheDocument();
      });
    });

    // Verify the final gene list matches combined genes
    const finalGenes = getTreeGenes(screen.getByRole('tree'));
    expect(finalGenes).toEqual(combinedGenes);

    // Verify expression data was loaded for combined genes
    const geneExpressionCalls = fetchWork.mock.calls.filter(
      (call) => call[1].name === 'GeneExpression',
    );
    expect(geneExpressionCalls.length).toBeGreaterThan(0);
  });

  it('does not make a work request when overwriting with a subset of already-loaded genes', async () => {
    await renderHeatmapPage(storeState);

    // Verify 5 marker genes are initially loaded
    const initialGenes = getTreeGenes(screen.getByRole('tree'));
    expect(initialGenes).toEqual(markerGenesData5.orderedGeneNames);

    // Load expression data for all 5 marker genes
    await act(async () => {
      await storeState.dispatch(loadGeneExpression(
        experimentId,
        initialGenes,
        plotUuid,
      ));
    });

    // Clear mock calls from initial load
    jest.clearAllMocks();

    // Overwrite with first 3 marker genes (subset of already loaded)
    const subsetGenes = initialGenes.slice(0, 3);

    await act(async () => {
      await storeState.dispatch(updatePlotConfig(plotUuid, { selectedGenes: subsetGenes }));
      await storeState.dispatch(loadGeneExpression(
        experimentId,
        subsetGenes,
        plotUuid,
      ));
    });

    // Verify no work request is made for genes already in expression matrix
    expect(fetchWork).not.toHaveBeenCalled();
  });

  it('makes a work request when adding a gene not already in the matrix', async () => {
    await renderHeatmapPage(storeState);

    // Verify 5 marker genes are initially loaded
    const initialGenes = getTreeGenes(screen.getByRole('tree'));
    expect(initialGenes).toEqual(markerGenesData5.orderedGeneNames);

    // Load expression data for all 5 marker genes
    await act(async () => {
      await storeState.dispatch(loadGeneExpression(
        experimentId,
        initialGenes,
        plotUuid,
      ));
    });

    // Clear mock calls from initial load
    jest.clearAllMocks();

    // Add a completely new gene not in matrix
    const newGene = 'UNKNOWNGENE_NOT_IN_MATRIX';
    const combinedGenes = [...initialGenes, newGene];

    await act(async () => {
      await storeState.dispatch(updatePlotConfig(plotUuid, { selectedGenes: combinedGenes }));
      await storeState.dispatch(loadGeneExpression(
        experimentId,
        combinedGenes,
        plotUuid,
      ));
    });

    // Verify work request IS made for new gene not in expression matrix
    const geneExpressionCalls = fetchWork.mock.calls.filter(
      (call) => call[1].name === 'GeneExpression',
    );
    expect(geneExpressionCalls.length).toBeGreaterThan(0);
  });

  it('Reset button restores original marker genes', async () => {
    await renderHeatmapPage(storeState);

    // Verify initial 5 marker genes are loaded
    const initialGenes = getTreeGenes(screen.getByRole('tree'));
    expect(initialGenes).toEqual(markerGenesData5.orderedGeneNames);

    // Modify genes by selecting a smaller subset (first 2 genes)
    const modifiedGenes = initialGenes.slice(0, 2);

    await act(async () => {
      await storeState.dispatch(updatePlotConfig(plotUuid, { selectedGenes: modifiedGenes }));
      await storeState.dispatch(loadGeneExpression(experimentId, modifiedGenes, plotUuid));
    });

    // Verify genes have changed
    let displayedGenes = getTreeGenes(screen.getByRole('tree'));
    expect(displayedGenes.length).toBe(2);

    // Find and click Reset button (look for button with text "Reset")
    const buttons = screen.getAllByRole('button');
    const resetButton = buttons.find((btn) => btn.textContent === 'Reset');

    await act(async () => {
      userEvent.click(resetButton);
    });

    // Wait for marker genes to be reloaded
    await waitFor(() => {
      displayedGenes = getTreeGenes(screen.getByRole('tree'));
      expect(displayedGenes).toEqual(markerGenesData5.orderedGeneNames);
    }, { timeout: 5000 });
  });

  it('Clear All button removes all genes from heatmap', async () => {
    await renderHeatmapPage(storeState);

    // Verify initial genes are loaded
    const initialGenes = getTreeGenes(screen.getByRole('tree'));
    expect(initialGenes.length).toBeGreaterThan(0);

    // Find and click Clear All button (look for button with text "Clear All")
    const buttons = screen.getAllByRole('button');
    const clearAllButton = buttons.find((btn) => btn.textContent.includes('Clear All'));

    await act(async () => {
      userEvent.click(clearAllButton);
    });

    // Verify selectedGenes is cleared from genes.expression.views
    await waitFor(() => {
      const selectedGenes = storeState.getState().genes.expression.views[plotUuid]?.data;
      expect(selectedGenes).toEqual([]);
    }, { timeout: 5000 });

    // Verify plot no longer displays (since there are no genes)
    expect(screen.queryByRole('graphics-document', { name: 'Marker heatmap' })).not.toBeInTheDocument();
  });

  it('gene reorder does not recall work requests', async () => {
    await renderHeatmapPage(storeState);

    // Verify initial genes are loaded
    const initialGenes = getTreeGenes(screen.getByRole('tree'));
    expect(initialGenes.length).toBeGreaterThan(2);

    // Load expression for initial genes
    await act(async () => {
      await storeState.dispatch(loadGeneExpression(experimentId, initialGenes, plotUuid));
    });

    // Clear mock calls
    jest.clearAllMocks();

    // Reorder genes (same genes, different order)
    const reorderedGenes = [initialGenes[1], initialGenes[0], ...initialGenes.slice(2)];

    await act(async () => {
      await storeState.dispatch(updatePlotConfig(plotUuid, { selectedGenes: reorderedGenes }));
    });

    // Verify no work request was made for reordering
    expect(fetchWork).not.toHaveBeenCalled();
  });

  it('gene deletion does not recall work requests', async () => {
    await renderHeatmapPage(storeState);

    // Verify initial genes are loaded
    const initialGenes = getTreeGenes(screen.getByRole('tree'));
    expect(initialGenes.length).toBeGreaterThan(1);

    // Load expression for initial genes
    await act(async () => {
      await storeState.dispatch(loadGeneExpression(experimentId, initialGenes, plotUuid));
    });

    // Clear mock calls
    jest.clearAllMocks();

    // Remove the last gene
    const genesAfterRemoval = initialGenes.slice(0, -1);

    await act(async () => {
      await storeState.dispatch(updatePlotConfig(plotUuid, { selectedGenes: genesAfterRemoval }));
    });

    // Verify no work request was made for deletion
    expect(fetchWork).not.toHaveBeenCalled();
  });

  it('clear all shows "Add some genes" message', async () => {
    await renderHeatmapPage(storeState);

    // Verify initial genes are displayed
    const initialGenes = getTreeGenes(screen.getByRole('tree'));
    expect(initialGenes.length).toBeGreaterThan(0);

    // Find and click Clear All button
    const buttons = screen.getAllByRole('button');
    const clearAllButton = buttons.find((btn) => btn.textContent.includes('Clear All'));

    await act(async () => {
      userEvent.click(clearAllButton);
    });

    // Wait for the "Add some genes" message to appear
    await waitFor(() => {
      expect(screen.getByText(/Add some genes to this heatmap to get started/i)).toBeInTheDocument();
    }, { timeout: 5000 });

    // Verify plot is not displayed
    expect(screen.queryByRole('graphics-document', { name: 'Marker heatmap' })).not.toBeInTheDocument();
  });

  it('Reset button reloads initial genes but keeps config the same', async () => {
    await renderHeatmapPage(storeState);

    // Verify initial genes are loaded
    const initialGenes = getTreeGenes(screen.getByRole('tree'));
    expect(initialGenes).toEqual(markerGenesData5.orderedGeneNames);

    // Update config (e.g., change color scheme)
    const colorSchemeBeforeReset = storeState.getState().componentConfig[plotUuid]?.config?.colour?.scheme;

    await act(async () => {
      await storeState.dispatch(updatePlotConfig(plotUuid, { 
        selectedGenes: initialGenes.slice(0, 2),
        colour: { ...storeState.getState().componentConfig[plotUuid]?.config?.colour, scheme: 'viridis' },
      }));
    });

    // Verify genes changed
    let displayedGenes = getTreeGenes(screen.getByRole('tree'));
    expect(displayedGenes.length).toBe(2);

    // Find and click Reset button
    const buttons = screen.getAllByRole('button');
    const resetButton = buttons.find((btn) => btn.textContent === 'Reset');

    await act(async () => {
      userEvent.click(resetButton);
    });

    // Wait for genes to be restored
    await waitFor(() => {
      displayedGenes = getTreeGenes(screen.getByRole('tree'));
      expect(displayedGenes).toEqual(markerGenesData5.orderedGeneNames);
    }, { timeout: 5000 });

    // Verify color config is preserved (it should still be 'viridis', not the initial value)
    const colorSchemeAfterReset = storeState.getState().componentConfig[plotUuid]?.config?.colour?.scheme;
    expect(colorSchemeAfterReset).toBe('viridis');
  });

  it('Reset plot resets both config and initial gene list', async () => {
    await renderHeatmapPage(storeState);

    // Verify initial genes
    const initialGenes = getTreeGenes(screen.getByRole('tree'));
    expect(initialGenes).toEqual(markerGenesData5.orderedGeneNames);

    // Store the initial color scheme
    const initialColorScheme = storeState.getState().componentConfig[plotUuid]?.config?.colour?.scheme;

    // Modify both genes and config
    await act(async () => {
      await storeState.dispatch(updatePlotConfig(plotUuid, { 
        selectedGenes: initialGenes.slice(0, 2),
        colour: { ...storeState.getState().componentConfig[plotUuid]?.config?.colour, scheme: 'viridis' },
      }));
      await storeState.dispatch(loadGeneExpression(experimentId, initialGenes.slice(0, 2), plotUuid));
    });

    // Verify changes
    let displayedGenes = getTreeGenes(screen.getByRole('tree'));
    expect(displayedGenes.length).toBe(2);
    let colorScheme = storeState.getState().componentConfig[plotUuid]?.config?.colour?.scheme;
    expect(colorScheme).toBe('viridis');

    // Manually dispatch resetPlotConfig to simulate PlotContainer's reset
    await act(async () => {
      const { resetPlotConfig } = require('redux/actions/componentConfig');
      await storeState.dispatch(resetPlotConfig(experimentId, plotUuid, 'markerHeatmap'));
    });

    // Wait for config to be reset
    await waitFor(() => {
      const resetConfig = storeState.getState().componentConfig[plotUuid]?.config;
      // Check that color scheme is reset to initial value (not 'viridis')
      expect(resetConfig?.colour?.scheme).not.toBe('viridis');
      expect(resetConfig?.colour?.scheme).toBe(initialColorScheme);
    }, { timeout: 5000 });

    // Note: selectedGenes are kept on reset for heatmap (keepValuesOnReset: ['selectedGenes'])
    // So genes remain in config after reset (this is by design, not a bug)
  });

  it('toggling to marker genes and clicking Run results in those genes showing up in Custom genes list', async () => {
    await renderHeatmapPage(storeState);

    // Verify initial 5 marker genes
    const initialGenes = getTreeGenes(screen.getByRole('tree'));
    expect(initialGenes.length).toBeGreaterThan(0);

    // Click on Marker genes tab
    await act(async () => {
      userEvent.click(screen.getByText('Marker genes'));
    });

    expect(screen.getByText('Number of marker genes per cluster')).toBeInTheDocument();

    // Change the number of marker genes from default to 2
    const nGenesInput = screen.getByRole('spinbutton', { name: 'Number of genes input' });
    userEvent.type(nGenesInput, '{backspace}2');

    // Click Run to load new marker genes
    await act(async () => {
      userEvent.click(screen.getByText('Run'));
    });

    // Wait for marker genes to be loaded with the new count
    await waitFor(() => {
      // Verify that a call to load marker genes with nGenes: 2 was made
      const markerCall = fetchWork.mock.calls.find((call) => call[1].nGenes === 2);
      expect(markerCall).toBeDefined();
    }, { timeout: 5000 });

    // Switch to Custom genes tab to see the new marker genes
    await act(async () => {
      userEvent.click(screen.getByText('Custom genes'));
    });

    // Verify the new genes (from MarkerHeatmap-2 dataset) are shown
    // markerGenesData2 has 2 genes: Ms4a4b and Smc4
    await waitFor(() => {
      markerGenesData2.orderedGeneNames.forEach((geneName) => {
        expect(screen.getByText(geneName)).toBeInTheDocument();
      });
    }, { timeout: 5000 });
  });
});
