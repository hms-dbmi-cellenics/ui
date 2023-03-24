import _ from 'lodash';
import React from 'react';
import preloadAll from 'jest-next-dynamic';

import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';

import { dispatchWorkRequest, seekFromS3 } from 'utils/work/seekWorkResponse';

import { Provider } from 'react-redux';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import markerGenesData2 from '__test__/data/marker_genes_2.json';
import markerGenesData5 from '__test__/data/marker_genes_5.json';
import cellSetsData from '__test__/data/cell_sets.json';

import { makeStore } from 'redux/store';

import mockAPI, {
  generateDefaultMockAPIResponses,
  delayedResponse,
} from '__test__/test-utils/mockAPI';

import HeatmapPlot from 'components/data-exploration/heatmap/HeatmapPlot';

import { loadProcessingSettings } from 'redux/actions/experimentSettings';
import { loadGeneExpression } from 'redux/actions/genes';

import { loadBackendStatus } from 'redux/actions/backendStatus';

import fake from '__test__/test-utils/constants';
import { loadCellSets, setCellSetHiddenStatus } from 'redux/actions/cellSets';
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
  seekFromS3: jest.fn(),
}));

let vitesscePropsSpy = null;
jest.mock('next/dynamic', () => () => (props) => {
  vitesscePropsSpy = props;
  return 'Sup Im a heatmap';
});

jest.mock('lodash/sampleSize', () => ({
  default: (collection, size) => collection.slice(0, size),
  __esModule: true,
}));

enableFetchMocks();

const mockWorkerResponses = {
  '5-marker-genes': () => Promise.resolve(_.cloneDeep(markerGenesData5)),
  '2-marker-genes': () => Promise.resolve(_.cloneDeep(markerGenesData2)),
};

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
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    fetchMock.resetMocks();
    fetchMock.doMock();

    fetchMock.mockIf(/.*/, mockAPI(mockAPIResponses));

    seekFromS3
      .mockReset()
      .mockImplementationOnce(() => null)
      .mockImplementationOnce((mockEtag) => mockWorkerResponses[mockEtag]());

    vitesscePropsSpy = null;

    storeState = makeStore();

    await storeState.dispatch(loadProcessingSettings(experimentId));
    await storeState.dispatch(loadBackendStatus(experimentId));
  });

  it('Renders the heatmap component by default if everything loads', async () => {
    await storeState.dispatch(loadCellSets(experimentId));

    await loadAndRenderDefaultHeatmap(storeState);

    expect(screen.getByText(/Sup Im a heatmap/i)).toBeInTheDocument();

    // Renders correct cells and genes
    expect(vitesscePropsSpy.expressionMatrix.rows).toMatchSnapshot();
    expect(vitesscePropsSpy.expressionMatrix.cols).toMatchSnapshot();
  });

  it('Shows loader message if cellSets are loading', async () => {
    const mockLoadingAPIResponses = {
      ...mockWorkerResponses,
      [`experiments/${experimentId}/cellSets`]: () => delayedResponse({ body: 'Not found', status: 404 }, 4000),
    };

    fetchMock.mockIf(/.*/, mockAPI(mockLoadingAPIResponses));

    await storeState.dispatch(loadCellSets(experimentId));

    await loadAndRenderDefaultHeatmap(storeState);

    expect(screen.getByText(/We're getting your data .../i)).toBeInTheDocument();
  });

  it('Shows loader message if the marker genes are loading', async () => {
    const customWorkerResponses = {
      ...mockWorkerResponses,
      '5-marker-genes': () => delayedResponse({ body: 'Not found', status: 404 }, 4000),
    };

    await storeState.dispatch(loadCellSets(experimentId));

    seekFromS3
      .mockReset()
      .mockImplementationOnce(() => null)
      .mockImplementationOnce((mockEtag) => customWorkerResponses[mockEtag]());

    await loadAndRenderDefaultHeatmap(storeState);

    expect(screen.getByText(/We're getting your data .../i)).toBeInTheDocument();
  });

  it('Shows loader message if the marker genes are loaded but there\'s other selected genes still loading', async () => {
    const customWorkerResponses = {
      ...mockWorkerResponses,
      'loading_gene_id-expression': () => delayedResponse({ body: 'Not found', status: 404 }, 4000),
    };

    seekFromS3
      .mockReset()
      // 1st set of marker gene calls
      .mockImplementationOnce((mockEtag) => customWorkerResponses[mockEtag]())
      // 2nd set of marker gene calls
      .mockImplementationOnce((mockEtag) => customWorkerResponses[mockEtag]());

    await storeState.dispatch(loadCellSets(experimentId));

    await loadAndRenderDefaultHeatmap(storeState);

    // Renders correctly
    expect(screen.getByText(/Sup Im a heatmap/i)).toBeInTheDocument();

    // A new gene is being loaded
    await act(async () => {
      storeState.dispatch(loadGeneExpression(experimentId, [...markerGenesData5.orderedGeneNames, 'loading_gene_id'], 'interactiveHeatmap', true));
    });

    // Loading screen shows up
    expect(screen.getByText(/We're getting your data .../i)).toBeInTheDocument();
  });

  it('Handles marker genes loading error correctly', async () => {
    const customWorkerResponses = {
      ...mockWorkerResponses,
      '5-marker-genes': errorResponse,
    };

    seekFromS3
      .mockReset()
      .mockImplementationOnce(() => Promise.resolve(null))
      .mockImplementationOnce((mockEtag) => customWorkerResponses[mockEtag]());

    await storeState.dispatch(loadCellSets(experimentId));

    await loadAndRenderDefaultHeatmap(storeState);

    // Error screen shows up
    expect(screen.getByText(/We're sorry, we couldn't load this./i)).toBeInTheDocument();
  });

  it('Handles expression data loading error correctly', async () => {
    const customWorkerResponses = {
      ...mockWorkerResponses,
      'loading_gene_id-expression': errorResponse,
    };

    dispatchWorkRequest
      .mockImplementationOnce(() => true)
      .mockImplementationOnce(errorResponse);

    seekFromS3
      .mockReset()
      // 1st set of marker gene calls
      .mockImplementationOnce(() => Promise.resolve(null))
      .mockImplementationOnce((mockEtag) => customWorkerResponses[mockEtag]())
      // 2nd set of marker gene calls
      .mockImplementationOnce(() => Promise.resolve(null))
      .mockImplementationOnce((mockEtag) => customWorkerResponses[mockEtag]());

    await storeState.dispatch(loadCellSets(experimentId));

    await loadAndRenderDefaultHeatmap(storeState);

    // Renders correctly
    expect(screen.getByText(/Sup Im a heatmap/i)).toBeInTheDocument();

    // A new gene is being loaded
    await act(async () => {
      await storeState.dispatch(loadGeneExpression(experimentId, [...markerGenesData5.orderedGeneNames, 'loading_gene_id'], 'interactiveHeatmap'));
    });

    // Error screen shows up
    expect(screen.getByText(/We're sorry, we couldn't load this./i)).toBeInTheDocument();
  });

  it('Does not display hidden cell sets', async () => {
    await storeState.dispatch(loadCellSets(experimentId));

    await loadAndRenderDefaultHeatmap(storeState);

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
    expect(isSubset(cellsInLouvain3, vitesscePropsSpy.expressionMatrix.rows)).toEqual(true);

    // If a louvain-3 is suddenly hidden
    await act(async () => {
      await storeState.dispatch(setCellSetHiddenStatus('louvain-3'));
    });

    // It performs the request with the new hidden cell sets array
    expect(dispatchWorkRequest).toHaveBeenCalledTimes(2);
    expect(dispatchWorkRequest.mock.calls[1]).toMatchSnapshot();
  });

  it('Shows an empty message when all cell sets are hidden ', async () => {
    seekFromS3.mockReset();
    seekFromS3.mockImplementationOnce((mockEtag) => mockWorkerResponses[mockEtag]());

    // Last call (all the cellSets are hidden) throw the error
    seekFromS3.mockImplementationOnce(() => Promise.reject(new Error('No cells found')));

    await storeState.dispatch(loadCellSets(experimentId));

    await loadAndRenderDefaultHeatmap(storeState);

    // Renders correctly
    expect(screen.getByText(/Sup Im a heatmap/i)).toBeInTheDocument();

    // If all cell sets are hidden
    const louvainClusterKeys = cellSetsData
      .cellSets.find(({ key: parentKey }) => parentKey === 'louvain')
      .children.map(({ key: cellSetKey }) => cellSetKey);

    const hideAllCellsPromise = louvainClusterKeys.map(async (cellSetKey) => {
      storeState.dispatch(setCellSetHiddenStatus(cellSetKey));
    });

    await act(async () => {
      await Promise.all(hideAllCellsPromise);
    });

    // The plots shows an empty message
    expect(screen.getByText(/Unhide some cell sets to show the heatmap/i)).toBeInTheDocument();
  });

  it('Reacts to cellClass groupby being changed', async () => {
    await storeState.dispatch(loadCellSets(experimentId));

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

    // It doesn't reorder the genes
    expect(vitesscePropsSpy.expressionMatrix.rows).toMatchSnapshot();
    // It reorders correctly
    expect(vitesscePropsSpy.expressionMatrix.cols).toMatchSnapshot();
  });

  it('Responds correctly to vitessce Heatmap callbacks', async () => {
    await storeState.dispatch(loadCellSets(experimentId));

    await loadAndRenderDefaultHeatmap(storeState);

    expect(screen.getByText(/Sup Im a heatmap/i)).toBeInTheDocument();

    // Renders the correct genes and cells
    expect(vitesscePropsSpy.expressionMatrix.rows).toMatchSnapshot();
    expect(vitesscePropsSpy.expressionMatrix.cols).toMatchSnapshot();

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
