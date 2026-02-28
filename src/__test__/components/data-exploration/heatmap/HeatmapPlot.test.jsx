import React from 'react';
import preloadAll from 'jest-next-dynamic';

import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';

import fetchWork from 'utils/work/fetchWork';

import { Provider } from 'react-redux';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import markerGenesData5 from '__test__/data/marker_genes_5.json';
import markerGenesWithExpression from '__test__/data/marker_genes_5_and_FAKE_gene.json';
import cellSetsData from '__test__/data/cell_sets.json';

import { makeStore } from 'redux/store';

import mockAPI, {
  generateDefaultMockAPIResponses,
  delayedResponse,
} from '__test__/test-utils/mockAPI';

import HeatmapPlot from 'components/data-exploration/heatmap/HeatmapPlot';

import { loadProcessingSettings } from 'redux/actions/experimentSettings';
import { loadDownsampledGeneExpression, loadMarkerGenes } from 'redux/actions/genes';
import { loadCellSets } from 'redux/actions/cellSets';
import { loadBackendStatus } from 'redux/actions/backendStatus';
import { loadComponentConfig } from 'redux/actions/componentConfig';

import fake from '__test__/test-utils/constants';
import { setCellSetHiddenStatus } from 'redux/actions/cellSets';
import { isSubset } from 'utils/arrayUtils';
import { updatePlotConfig } from 'redux/actions/componentConfig';

const experimentId = fake.EXPERIMENT_ID;

const COMPONENT_TYPE = 'interactiveHeatmap';

jest.mock('utils/work/fetchWork');

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
  MarkerHeatmap: () => ({ 
    orderedGeneNames: markerGenesData5.orderedGeneNames.slice(0, 5), 
    cellOrder: markerGenesData5.cellOrder 
  }),
  GeneExpression: () => ({
    orderedGeneNames: markerGenesWithExpression.orderedGeneNames.slice(0, 5),
    rawExpression: markerGenesWithExpression.rawExpression,
    stats: markerGenesWithExpression.stats,
  }),
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

let storeState = null;

describe('HeatmapPlot', () => {
  beforeAll(async () => {
    await preloadAll();
  });

  afterAll(() => {
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    fetchMock.resetMocks();
    fetchMock.doMock();

    fetchMock.mockIf(/.*/, mockAPI(mockAPIResponses));

    fetchWork
      .mockReset()
      .mockImplementation((_experimentId, body) => {
        const response = mockWorkerResponses[body.name];
        const result = typeof response === 'function' ? response() : response;
        return Promise.resolve(result);
      });

    vitesscePropsSpy = null;

    storeState = makeStore();

    await storeState.dispatch(loadProcessingSettings(experimentId));
    await storeState.dispatch(loadBackendStatus(experimentId));
    await storeState.dispatch(loadCellSets(experimentId));
    await storeState.dispatch(loadComponentConfig(experimentId, COMPONENT_TYPE, COMPONENT_TYPE));
  });

  it('Renders the heatmap component by default if everything loads', async () => {
    // Pre-load the gene data before rendering so component has it on mount
    await act(async () => {
      await storeState.dispatch(loadMarkerGenes(
        experimentId,
        COMPONENT_TYPE,
        { numGenes: 5, groupedTracks: ['louvain', 'sample'], selectedCellSet: 'louvain', selectedPoints: 'All' },
      ));
    });

    await act(async () => {
      await storeState.dispatch(loadDownsampledGeneExpression(
        experimentId,
        markerGenesData5.orderedGeneNames.slice(0, 5),
        COMPONENT_TYPE,
      ));
    });

    await loadAndRenderDefaultHeatmap(storeState);

    await waitFor(() => {
      expect(screen.getByText(/Sup Im a heatmap/i)).toBeInTheDocument();
    }, { timeout: 5000 });

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
      [`/v2/workRequest/${experimentId}`]: () => delayedResponse({ body: 'Not found', status: 404 }, 10000),
      ...mockWorkerResponses,
    };

    fetchMock.mockIf(/.*/, mockAPI(customWorkerResponses));

    await loadAndRenderDefaultHeatmap(storeState);

    expect(screen.getByText(/Assigning a worker to your analysis/i)).toBeInTheDocument();
  });

  it('Shows loader message if the marker genes are loaded but there\'s other selected genes still loading', async () => {
    // First load the marker genes
    await act(async () => {
      await storeState.dispatch(loadMarkerGenes(
        experimentId,
        COMPONENT_TYPE,
        { numGenes: 5, groupedTracks: ['louvain', 'sample'], selectedCellSet: 'louvain', selectedPoints: 'All' },
      ));
    });

    // Then load some expression data
    await act(async () => {
      await storeState.dispatch(loadDownsampledGeneExpression(
        experimentId,
        markerGenesData5.orderedGeneNames.slice(0, 5),
        COMPONENT_TYPE,
      ));
    });

    await loadAndRenderDefaultHeatmap(storeState);

    // Renders correctly with loaded genes
    await waitFor(() => {
      expect(screen.getByText(/Sup Im a heatmap/i)).toBeInTheDocument();
    }, { timeout: 5000 });

    // Verify that vitesse props are correct
    expect(vitesscePropsSpy.uint8ObsFeatureMatrix).toMatchSnapshot();
  });

  it('Handles marker genes loading error correctly', async () => {
    fetchWork
      .mockReset()
      .mockImplementationOnce(() => Promise.reject(new Error('Some error idk')));

    await loadAndRenderDefaultHeatmap(storeState);

    // Error screen shows up
    expect(screen.getByText(/We're sorry, we couldn't load this./i)).toBeInTheDocument();
  });

  it('Handles expression data loading error correctly', async () => {
    // Pre-load marker genes and expression data first
    await act(async () => {
      await storeState.dispatch(loadMarkerGenes(
        experimentId,
        COMPONENT_TYPE,
        { numGenes: 5, groupedTracks: ['louvain', 'sample'], selectedCellSet: 'louvain', selectedPoints: 'All' },
      ));
    });

    await act(async () => {
      await storeState.dispatch(loadDownsampledGeneExpression(
        experimentId,
        markerGenesData5.orderedGeneNames.slice(0, 5),
        COMPONENT_TYPE,
      ));
    });

    await act(async () => {
      await loadAndRenderDefaultHeatmap(storeState);
    });

    // Renders correctly
    expect(screen.getByText(/Sup Im a heatmap/i)).toBeInTheDocument();

    // A new gene is being loaded, set mock to reject
    fetchWork
      .mockReset()
      .mockImplementationOnce(() => Promise.reject(new Error('Some error idk')));

    await act(async () => {
      await storeState.dispatch(loadDownsampledGeneExpression(experimentId, [...markerGenesData5.orderedGeneNames, 'loading_gene_id'], 'interactiveHeatmap'));
    });

    // Error screen shows up
    expect(screen.getByText(/We're sorry, we couldn't load this./i)).toBeInTheDocument();
  });

  it('Does not display hidden cell sets', async () => {
    // Pre-load gene data
    await act(async () => {
      await storeState.dispatch(loadMarkerGenes(
        experimentId,
        COMPONENT_TYPE,
        { numGenes: 5, groupedTracks: ['louvain', 'sample'], selectedCellSet: 'louvain', selectedPoints: 'All' },
      ));
    });

    await act(async () => {
      await storeState.dispatch(loadDownsampledGeneExpression(
        experimentId,
        markerGenesData5.orderedGeneNames.slice(0, 5),
        COMPONENT_TYPE,
      ));
    });

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

    // It loaded the marker genes and expression data (2 calls)
    expect(fetchWork).toHaveBeenCalledTimes(2);
    expect(fetchWork.mock.calls[0][1].name === 'MarkerHeatmap').toBe(true);
    expect(fetchWork.mock.calls[1][1].name === 'GeneExpression').toBe(true);

    // It shows cells in louvain-3
    expect(isSubset(cellsInLouvain3, vitesscePropsSpy.obsIndex)).toEqual(true);

    // If a louvain-3 is suddenly hidden
    await act(() => {
      storeState.dispatch(setCellSetHiddenStatus('louvain-3'));
    });

    await act(() => {
      jest.runAllTimers();
    });

    // It does not re-request a new hidden cell sets array
    // (just hides what is already calculated)
    // TODO: restore prior behavior for spatial (more on/off)
    expect(fetchWork).toHaveBeenCalledTimes(2);
  });

  it('Reacts to cellClass groupby being changed', async () => {
    // Pre-load gene data
    await act(async () => {
      await storeState.dispatch(loadMarkerGenes(
        experimentId,
        COMPONENT_TYPE,
        { numGenes: 5, groupedTracks: ['louvain', 'sample'], selectedCellSet: 'louvain', selectedPoints: 'All' },
      ));
    });

    await act(async () => {
      await storeState.dispatch(loadDownsampledGeneExpression(
        experimentId,
        markerGenesData5.orderedGeneNames.slice(0, 5),
        COMPONENT_TYPE,
      ));
    });

    await loadAndRenderDefaultHeatmap(storeState);

    // Renders correctly
    expect(screen.getByText(/Sup Im a heatmap/i)).toBeInTheDocument();

    // If groupedTracks change
    await act(async () => {
      await storeState.dispatch(
        updatePlotConfig('interactiveHeatmap', {
          groupedTracks: ['louvain', 'sample'],
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
    // Pre-load gene data
    await act(async () => {
      await storeState.dispatch(loadMarkerGenes(
        experimentId,
        COMPONENT_TYPE,
        { numGenes: 5, groupedTracks: ['louvain', 'sample'], selectedCellSet: 'louvain', selectedPoints: 'All' },
      ));
    });

    await act(async () => {
      await storeState.dispatch(loadDownsampledGeneExpression(
        experimentId,
        markerGenesData5.orderedGeneNames.slice(0, 5),
        COMPONENT_TYPE,
      ));
    });

    await loadAndRenderDefaultHeatmap(storeState);

    await waitFor(() => {
      expect(screen.getByText(/Sup Im a heatmap/i)).toBeInTheDocument();
    }, { timeout: 5000 });

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
