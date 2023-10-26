import React from 'react';
import preloadAll from 'jest-next-dynamic';

import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';

import { dispatchWorkRequest } from 'utils/work/seekWorkResponse';

import { Provider } from 'react-redux';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import markerGenesData2 from '__test__/data/marker_genes_2.json';
import markerGenesData5 from '__test__/data/marker_genes_5.json';
import noCellsGeneExpression from '__test__/data/no_cells_genes_expression.json';
import cellSetsData from '__test__/data/cell_sets.json';

import { makeStore } from 'redux/store';

import mockAPI, {
  generateDefaultMockAPIResponses,
  delayedResponse,
  dispatchWorkRequestMock,
} from '__test__/test-utils/mockAPI';

import HeatmapPlot from 'components/data-exploration/heatmap/HeatmapPlot';

import { loadProcessingSettings } from 'redux/actions/experimentSettings';
import { loadDownsampledGeneExpression } from 'redux/actions/genes';

import { loadBackendStatus } from 'redux/actions/backendStatus';

import fake from '__test__/test-utils/constants';
import { setCellSetHiddenStatus } from 'redux/actions/cellSets';
import { isSubset } from 'utils/arrayUtils';
import { updatePlotConfig } from 'redux/actions/componentConfig';

const experimentId = fake.EXPERIMENT_ID;

// Mock hash so we can control the ETag that is produced by hash.MD5 when fetching work requests
// EtagParams is the object that's passed to the function which generates ETag in fetchWork
jest.mock('object-hash', () => {
  const objectHash = jest.requireActual('object-hash');
  const mockWorkResultETag = jest.requireActual('__test__/test-utils/mockWorkResultETag');
  const mockWorkRequestETag = (ETagParams) => `${ETagParams.body.nGenes}-marker-genes`;
  const mockGeneExpressionETag = (ETagParams) => `${ETagParams.missingGenesBody.genes.join('-')}-expression`;

  return mockWorkResultETag(objectHash, mockWorkRequestETag, mockGeneExpressionETag);
});

jest.mock('utils/work/seekWorkResponse', () => ({
  __esModule: true,
  dispatchWorkRequest: jest.fn(() => true),
}));

let vitesscePropsSpy = null;
jest.mock('next/dynamic', () => () => (props) => {
  console.log('*** we are coming here: ', props);
  vitesscePropsSpy = props;
  return 'Sup Im a heatmap';
});

jest.mock('lodash/sampleSize', () => ({
  default: (collection, size) => collection.slice(0, size),
  __esModule: true,
}));

enableFetchMocks();

const mockWorkerResponses = {
  '5-marker-genes': markerGenesData5,
  '2-marker-genes': markerGenesData2,
};

const newGeneLoadETag = 'Ms4a4b-Smc4-Ccr7-Ifi27l2a-Gm8369-S100a4-S100a6-Tmem176a-Tmem176b-Cxcr6-5830411N06Rik-Lmo4-Il18r1-Atp2b1-Pde5a-Ccl5-Nkg7-Klrd1-AW112010-Klrc1-Gzma-Stmn1-Hmgn2-Pclaf-Tuba1b-Lyz2-Ifitm3-Fcer1g-Tyrobp-Cst3-Cd74-Igkc-Cd79a-H2-Ab1-H2-Eb1-loading_gene_id-expression';

const loadAndRenderDefaultHeatmap = async (storeState) => {
  await act(async () => {
    render(
      <Provider store={storeState}>
        <HeatmapPlot
          experimentId={experimentId}
          width={50}
          height={50}
        />
      </Provider>,
    );
  });
};

const mockAPIResponses = generateDefaultMockAPIResponses(experimentId);

const errorResponse = () => Promise.reject(new Error('Some error idk'));

let storeState = null;

describe('HeatmapPlot', () => {
  beforeAll(async () => {
    await preloadAll();
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(async () => {
    jest.runAllTimers();
    jest.clearAllMocks();

    fetchMock.resetMocks();
    fetchMock.doMock();

    fetchMock.mockIf(/.*/, mockAPI(mockAPIResponses));

    dispatchWorkRequest
      .mockReset()
      .mockImplementationOnce(dispatchWorkRequestMock(mockWorkerResponses));

    vitesscePropsSpy = null;

    storeState = makeStore();

    await storeState.dispatch(loadProcessingSettings(experimentId));
    await storeState.dispatch(loadBackendStatus(experimentId));
  });

  it('Renders the heatmap component by default if everything loads', async () => {
    fetchMock.mockIf(/.*/, mockAPI({
      [`/v2/workRequest/${experimentId}/5-marker-genes$`]: () => Promise.resolve(JSON.stringify(true)),
      ...mockAPIResponses,
    }));

    await loadAndRenderDefaultHeatmap(storeState);

    expect(screen.getByText(/Sup Im a heatmap/i)).toBeInTheDocument();

    // Renders correct cells and genes
    expect(vitesscePropsSpy.uint8ObsFeatureMatrix).toMatchSnapshot();
    expect(vitesscePropsSpy.featureIndex).toMatchSnapshot();
  });

  it('Shows loader message if cellSets are loading', async () => {
    const mockLoadingAPIResponses = {
      ...mockWorkerResponses,
      [`experiments/${experimentId}/cellSets$`]: () => delayedResponse({ body: 'Not found', status: 404 }, 4000),
    };

    fetchMock.mockIf(/.*/, mockAPI(mockLoadingAPIResponses));

    await loadAndRenderDefaultHeatmap(storeState);

    expect(screen.getByText(/Assigning a worker to your analysis/i)).toBeInTheDocument();
  });

  it('Shows loader message if the marker genes are loading', async () => {
    const customWorkerResponses = {
      [`/v2/workRequest/${experimentId}/5-marker-genes`]: () => delayedResponse({ body: 'Not found', status: 404 }, 10000),
      ...mockWorkerResponses,
    };

    fetchMock.mockIf(/.*/, mockAPI(customWorkerResponses));

    dispatchWorkRequest
      .mockReset()
      .mockImplementationOnce(dispatchWorkRequestMock(mockWorkerResponses));

    await loadAndRenderDefaultHeatmap(storeState);

    expect(screen.getByText(/Assigning a worker to your analysis/i)).toBeInTheDocument();
  });

  it('Shows loader message if the marker genes are loaded but there\'s other selected genes still loading', async () => {
    const customWorkerResponses = {
      ...mockWorkerResponses,
      [newGeneLoadETag]: () => delayedResponse({ body: 'Not found', status: 404 }, 4000),
    };

    dispatchWorkRequest
      .mockReset()
      .mockImplementation(dispatchWorkRequestMock(customWorkerResponses));

    await loadAndRenderDefaultHeatmap(storeState);

    // Renders correctly
    expect(screen.getByText(/Sup Im a heatmap/i)).toBeInTheDocument();

    // A new gene is being loaded
    await act(async () => {
      storeState.dispatch(loadDownsampledGeneExpression(experimentId, [...markerGenesData5.orderedGeneNames, 'loading_gene_id'], 'interactiveHeatmap'));
      jest.runAllTimers();
    });

    // Loading screen shows up
    await waitFor(() => {
      expect(screen.getByText(/Assigning a worker to your analysis/i)).toBeInTheDocument();
    });
  });

  it('Handles marker genes loading error correctly', async () => {
    const customWorkerResponses = {
      ...mockWorkerResponses,
      '5-marker-genes': errorResponse,
    };

    dispatchWorkRequest
      .mockReset()
      .mockImplementationOnce(() => Promise.resolve(null))
      .mockImplementationOnce(dispatchWorkRequestMock(customWorkerResponses));

    await loadAndRenderDefaultHeatmap(storeState);

    // Error screen shows up
    expect(screen.getByText(/We're sorry, we couldn't load this./i)).toBeInTheDocument();
  });

  it('Handles expression data loading error correctly', async () => {
    const customWorkerResponses = {
      ...mockWorkerResponses,
      [newGeneLoadETag]: errorResponse,
    };

    dispatchWorkRequest
      .mockReset()
      .mockImplementation(dispatchWorkRequestMock(customWorkerResponses));

    await act(async () => {
      await loadAndRenderDefaultHeatmap(storeState);
    });

    // Renders correctly
    expect(screen.getByText(/Sup Im a heatmap/i)).toBeInTheDocument();

    // A new gene is being loaded
    await act(async () => {
      await storeState.dispatch(loadDownsampledGeneExpression(experimentId, [...markerGenesData5.orderedGeneNames, 'loading_gene_id'], 'interactiveHeatmap'));
      jest.runAllTimers();
    });

    // Error screen shows up
    expect(screen.getByText(/We're sorry, we couldn't load this./i)).toBeInTheDocument();
  });

  it('Does not display hidden cell sets', async () => {
    await act(async () => {
      await loadAndRenderDefaultHeatmap(storeState);
    });

    // Renders correctly
    expect(screen.getByText(/Sup Im a heatmap/i)).toBeInTheDocument();

    // Cell ids stored in expression matrix is string,
    // whereas cell ids stored in the store are number
    // So we need to convert them to string to be able to compare the values
    const cellsInLouvain3 = cellSetsData
      .cellSets.find(({ key }) => key === 'louvain')
      .children.find(({ name }) => name === 'Cluster 3')
      .cellIds.map((cellId) => cellId.toString());

    // It loaded once the marker genes
    expect(dispatchWorkRequest).toHaveBeenCalledTimes(1);
    expect(dispatchWorkRequest.mock.calls[0][1].name === 'MarkerHeatmap').toBe(true);

    // It shows cells in louvain-3
    expect(isSubset(cellsInLouvain3, vitesscePropsSpy.obsIndex)).toEqual(true);

    // If a louvain-3 is suddenly hidden
    await act(() => {
      storeState.dispatch(setCellSetHiddenStatus('louvain-3'));
    });

    await act(() => {
      jest.runAllTimers();
    });

    // It performs the request with the new hidden cell sets array
    expect(dispatchWorkRequest).toHaveBeenCalledTimes(2);
    expect(dispatchWorkRequest.mock.calls[1]).toMatchSnapshot();
  });

  it('Shows an empty message when all cell sets are hidden ', async () => {
    dispatchWorkRequest
      .mockReset()
      // Mock each of the loadMarkerGenes calls caused by hiding a cell set
      .mockImplementation(dispatchWorkRequestMock(mockWorkerResponses));

    await loadAndRenderDefaultHeatmap(storeState);

    // Renders correctly
    expect(screen.getByText(/Sup Im a heatmap/i)).toBeInTheDocument();

    // If all cell sets are hidden
    const louvainClusterKeys = cellSetsData
      .cellSets.find(({ key: parentKey }) => parentKey === 'louvain')
      .children.map(({ key: cellSetKey }) => cellSetKey);

    dispatchWorkRequest
      .mockReset()
      // Last call (all the cellSets are hidden) return empty
      .mockImplementationOnce(() => Promise.resolve({ data: noCellsGeneExpression }));

    const hideAllCellsPromise = louvainClusterKeys.map(async (cellSetKey) => {
      storeState.dispatch(setCellSetHiddenStatus(cellSetKey));
    });

    await act(async () => {
      await Promise.all(hideAllCellsPromise);
    });

    await act(() => {
      jest.runAllTimers();
    });

    // The plots shows an empty message
    expect(screen.getByText(/Unhide some cell sets to show the heatmap/i)).toBeInTheDocument();
  });

  it('Reacts to cellClass groupby being changed', async () => {
    await loadAndRenderDefaultHeatmap(storeState);

    // Renders correctly
    expect(screen.getByText(/Sup Im a heatmap/i)).toBeInTheDocument();

    // If groupedTracks change
    await act(async () => {
      await storeState.dispatch(
        updatePlotConfig('interactiveHeatmap', {
          groupedTracks: ['sample', 'louvain'],
        }),
      );
    });

    await act(() => {
      jest.runAllTimers();
    });

    // It doesn't reorder the genes
    expect(vitesscePropsSpy.uint8ObsFeatureMatrix).toMatchSnapshot();
    // It reorders correctly
    expect(vitesscePropsSpy.featureIndex).toMatchSnapshot();
  });

  it('Responds correctly to vitessce Heatmap callbacks', async () => {
    await loadAndRenderDefaultHeatmap(storeState);

    expect(screen.getByText(/Sup Im a heatmap/i)).toBeInTheDocument();

    // Renders the correct genes and cells
    expect(vitesscePropsSpy.uint8ObsFeatureMatrix).toMatchSnapshot();
    expect(vitesscePropsSpy.featureIndex).toMatchSnapshot();

    // On changing the view state
    const updatedViewState = { zoom: 15, target: [1, 1] };
    await act(async () => {
      await vitesscePropsSpy.setViewState(updatedViewState);
    });

    // The viewState vitessce receives is updated
    expect(vitesscePropsSpy.viewState).toEqual(updatedViewState);

    // On hovering somewhere inside the heatmap
    const highlightedCell = '2';
    const highlightedGene = 'S100a4';
    await act(async () => {
      await vitesscePropsSpy.setCellHighlight(highlightedCell);
      await vitesscePropsSpy.setGeneHighlight(highlightedGene);
    });

    // It shows the cell info tooltip
    expect(screen.getByText(/Cell id: 2/i)).toBeInTheDocument();
    expect(screen.getByText(/Gene name: S100a4/i)).toBeInTheDocument();

    // On hovering outside
    await act(async () => {
      await vitesscePropsSpy.setCellHighlight(null);
      await vitesscePropsSpy.setGeneHighlight(null);
    });

    // It hides the tooltip
    expect(screen.queryByText(/Cell id:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Gene name:/i)).not.toBeInTheDocument();

    // On hovering over heatmap tracks
    await act(async () => {
      await vitesscePropsSpy.setTrackHighlight(['4', 0, 1, 2]);
    });

    // It shows the track cell info tooltip
    expect(screen.getByText(/Cell id: 4/i)).toBeInTheDocument();
    expect(screen.getByText(/Group name: Cluster 0/i)).toBeInTheDocument();

    // On hovering outside heatmap tracks
    await act(async () => {
      await vitesscePropsSpy.setTrackHighlight(null);
    });

    // It hides the track cell info tooltip
    expect(screen.queryByText(/Cell id:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Group name:/i)).not.toBeInTheDocument();

    // And doesn't show the normal cell info again
    expect(screen.queryByText(/Gene name:/i)).not.toBeInTheDocument();
  });
});
