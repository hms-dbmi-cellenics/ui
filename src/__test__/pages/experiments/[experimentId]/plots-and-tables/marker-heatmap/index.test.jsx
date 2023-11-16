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
import { loadDownsampledGeneExpression } from 'redux/actions/genes';
import { makeStore } from 'redux/store';
import { dispatchWorkRequest } from 'utils/work/seekWorkResponse';
import markerGenesData2 from '__test__/data/marker_genes_2.json';
import markerGenesData5 from '__test__/data/marker_genes_5.json';
import markerGenesData5AndFakeGene from '__test__/data/marker_genes_5_and_FAKE_gene.json';
import geneList from '__test__/data/paginated_gene_expression.json';

import preloadAll from 'jest-next-dynamic';

import fake from '__test__/test-utils/constants';
import mockAPI, {
  dispatchWorkRequestMock,
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

// Mock hash so we can control the ETag that is produced by hash.MD5 when fetching work requests
// EtagParams is the object that's passed to the function which generates ETag in fetchWork
jest.mock('object-hash', () => {
  const objectHash = jest.requireActual('object-hash');
  const mockWorkResultETag = jest.requireActual('__test__/test-utils/mockWorkResultETag');

  const mockWorkRequestETag = (ETagParams) => {
    if (ETagParams.body.name === 'ListGenes') return 'ListGenes';
    return `${ETagParams.body.nGenes}-marker-genes`;
  };

  const mockGeneExpressionETag = (ETagParams) => `${ETagParams.missingGenesBody.genes.join('-')}-expression`;

  return mockWorkResultETag(objectHash, mockWorkRequestETag, mockGeneExpressionETag);
});

// Disable local cache
jest.mock('localforage', () => ({
  getItem: () => Promise.resolve(undefined),
  setItem: () => Promise.resolve(),
  config: () => { },
  ready: () => Promise.resolve(),
  length: () => 0,
}));

jest.mock('utils/work/seekWorkResponse', () => ({
  __esModule: true,
  dispatchWorkRequest: jest.fn(),
}));

const fakeGenesETag = 'Ms4a4b-Smc4-Ccr7-Ifi27l2a-Gm8369-S100a4-S100a6-Tmem176a-Tmem176b-Cxcr6-5830411N06Rik-Lmo4-Il18r1-Atp2b1-Pde5a-Ccl5-Nkg7-Klrd1-AW112010-Klrc1-Gzma-Stmn1-Hmgn2-Pclaf-Tuba1b-Lyz2-Ifitm3-Fcer1g-Tyrobp-Cst3-Cd74-Igkc-Cd79a-H2-Ab1-H2-Eb1-FAKEGENE-expression';
const fakeGenesETag1 = 'Ms4a4b-Smc4-Ccr7-Ifi27l2a-Gm8369-S100a4-S100a6-Tmem176b-Cxcr6-5830411N06Rik-Lmo4-Il18r1-Atp2b1-Pde5a-Ccl5-Nkg7-Klrd1-AW112010-Klrc1-Gzma-Stmn1-Hmgn2-Pclaf-Tuba1b-Lyz2-Ifitm3-Fcer1g-Tyrobp-Cst3-Cd74-Igkc-Cd79a-H2-Ab1-H2-Eb1-expression';
const fakeGenesETag2 = 'Ms4a4b-Smc4-Ccr7-Ifi27l2a-Gm8369-S100a4-S100a6-Tmem176b-Cxcr6-5830411N06Rik-Lmo4-Il18r1-Atp2b1-Pde5a-Ccl5-Nkg7-Klrd1-AW112010-Klrc1-Gzma-Stmn1-Hmgn2-Pclaf-Tuba1b-Lyz2-Ifitm3-Fcer1g-Tyrobp-Cst3-Cd74-Igkc-Cd79a-H2-Ab1-H2-Eb1-Tmem176a-expression';

const mockWorkerResponses = {
  '5-marker-genes': markerGenesData5,
  '2-marker-genes': markerGenesData2,
  [fakeGenesETag]: markerGenesData5AndFakeGene,
  [fakeGenesETag1]: markerGenesData5AndFakeGene,
  [fakeGenesETag2]: markerGenesData5AndFakeGene,
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

    dispatchWorkRequest
      .mockReset()
      .mockImplementation(dispatchWorkRequestMock(mockWorkerResponses));

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
    dispatchWorkRequest
      .mockReset()
      .mockImplementation(
        (_experimentId, _body, _timeout, ETag) => {
          if (ETag === '5-marker-genes') return Promise.reject(new Error('Not found'));

          return workerDataResult(mockWorkerResponses[ETag]);
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
    dispatchWorkRequest
      .mockReset()
      .mockImplementation(dispatchWorkRequestMock(mockWorkerResponses));

    await renderHeatmapPage(storeState);

    // Add in a new gene
    const genesToLoad = [...markerGenesData5.orderedGeneNames, 'FAKEGENE'];

    await act(async () => {
      await storeState.dispatch(loadDownsampledGeneExpression(experimentId, genesToLoad, plotUuid));
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
    dispatchWorkRequest
      .mockReset()
      .mockImplementation((_experimentId, _body, _timeout, ETag) => {
        if (ETag === '5-marker-genes' || ETag === 'ListGenes') return workerDataResult(mockWorkerResponses[ETag]);

        if (ETag === 'FAKEGENE-expression') { return Promise.reject(new Error('Not found')); }
      });

    await renderHeatmapPage(storeState);

    const genesToLoad = [...markerGenesData5.orderedGeneNames, 'FAKEGENE'];

    await act(async () => {
      await storeState.dispatch(loadDownsampledGeneExpression(experimentId, genesToLoad, plotUuid));
    });

    // It shouldn't show the plot
    expect(screen.queryByRole('graphics-document', { name: 'Marker heatmap' })).toBeNull();

    // There is an error message
    expect(screen.getByText(/Could not load gene expression data/i)).toBeInTheDocument();
  });

  it('removing a gene keeps the sorted order without re-sorting', async () => {
    await renderHeatmapPage(storeState);

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

    const genesListAfterRemoval = getTreeGenes(geneTree);

    // remove element from list manually to compare
    genesListBeforeRemoval.splice(1, 1);

    // The gene should be deleted from the list
    expect(_.isEqual(genesListAfterRemoval, genesListBeforeRemoval)).toEqual(true);
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
      expect(dispatchWorkRequest).toHaveBeenCalledWith(
        experimentId,
        expect.objectContaining({
          name: 'GeneExpression',
          genes: expect.arrayContaining(['Tmem176a']),
        }),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
      );
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
});
