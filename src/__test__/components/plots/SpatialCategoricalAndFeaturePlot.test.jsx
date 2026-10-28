import React from 'react';
import { Provider } from 'react-redux';
import { act } from 'react-dom/test-utils';
import { render } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import SpatialCategoricalPlot from 'components/plots/SpatialCategoricalPlot';
import SpatialFeaturePlot from 'components/plots/SpatialFeaturePlot';
import { getSampleFileUrls } from 'utils/data-management/downloadSampleFile';
import { getCellSets } from 'redux/selectors';

jest.mock('utils/data-management/downloadSampleFile', () => ({
  getSampleFileUrls: jest.fn(),
}));

// Rendering / streaming deps are irrelevant to the URL-fetch + sample-default logic.
jest.mock('react-vega', () => ({ Vega: () => null }));
jest.mock('vega-webgl-renderer', () => ({}), { virtual: true });

jest.mock('components/plots/useSpatialStream', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    imageDims: null,
    segmentationsAvailable: false,
    segProbeDone: true,
    tissueImageData: null,
    segOverlayData: null,
    onViewportChange: jest.fn(),
    ready: false,
  })),
}));

jest.mock('components/plots/usePreventWheelScroll', () => ({
  __esModule: true,
  default: () => ({ current: null }),
}));

// Redux thunks dispatched on mount: no-op them so they don't hit the API.
jest.mock('redux/actions/cellSets', () => ({ loadCellSets: () => ({ type: 'TEST/loadCellSets' }) }));
jest.mock('redux/actions/embedding', () => ({ loadEmbedding: () => ({ type: 'TEST/loadEmbedding' }) }));
jest.mock('redux/actions/experimentSettings', () => ({ loadProcessingSettings: () => ({ type: 'TEST/loadProcessingSettings' }) }));

// Return a STABLE reference: a fresh object per call makes useSelector re-render
// on every mockStore dispatch, causing an infinite render/dispatch loop.
jest.mock('redux/selectors', () => {
  const cellSetsStub = { accessible: false, hierarchy: [], properties: {} };
  return { getCellSets: () => () => cellSetsStub };
});

jest.mock('utils/plotSpecs/generateSpatialCategoricalSpec', () => ({
  generateSpec: jest.fn(() => ({})),
  generateData: jest.fn(() => []),
  filterCells: jest.fn(() => ({ filteredCells: {} })),
}));

jest.mock('utils/plotSpecs/generateSpatialFeatureSpec', () => ({
  generateSpec: jest.fn(() => ({})),
  generateData: jest.fn(() => []),
  filterCells: jest.fn(() => ({ filteredCells: {}, filteredCellIds: new Set() })),
}));

const mockStore = configureMockStore([thunk]);

const experimentId = 'exp-1';
const sampleId = 'xenium-sample';

const config = {
  dimensions: { width: 100, height: 100 },
  colour: { gradient: 'default', toggleInvert: '#FFFFFF', masterColour: '#000000' },
  marker: { opacity: 10, outline: false },
  legend: { enabled: true },
  selectedSample: null,
  selectedCellSet: 'louvain',
};

const buildState = (technology, obj2sStatus = 'NOT_CREATED') => ({
  embeddings: { images: { data: [[1, 2]], loading: false, error: false } },
  experimentSettings: {
    info: { sampleIds: [sampleId] },
    originalProcessing: { configureEmbedding: { embeddingSettings: {} } },
  },
  backendStatus: { [experimentId]: { status: { obj2s: { status: obj2sStatus } } } },
  samples: { [sampleId]: { id: sampleId, type: technology } },
  genes: { expression: { full: { loading: false, matrix: {} } } },
});

const Components = [
  ['SpatialCategoricalPlot', SpatialCategoricalPlot],
  ['SpatialFeaturePlot', SpatialFeaturePlot],
];

describe.each(Components)('%s — imageless technology (e.g. Xenium)', (_name, Component) => {
  let onSampleDefault;

  const renderPlot = async (technology, plotConfig = config, obj2sStatus = undefined) => {
    onSampleDefault = jest.fn();
    const store = mockStore(buildState(technology, obj2sStatus));
    await act(async () => {
      render(
        <Provider store={store}>
          <Component
            experimentId={experimentId}
            config={plotConfig}
            onSampleDefault={onSampleDefault}
          />
        </Provider>,
      );
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    getSampleFileUrls.mockResolvedValue([{ url: 'http://example.com/seg.zarr.zip', fileId: sampleId }]);
  });

  it('skips the tissue-image (ome_zarr_zip) fetch for an imageless tech', async () => {
    await renderPlot('xenium');

    const requested = getSampleFileUrls.mock.calls.map(([, , fileType]) => fileType);
    expect(requested).not.toContain('ome_zarr_zip');
  });

  it('still fetches the segmentation OME-Zarr', async () => {
    await renderPlot('xenium');

    const requested = getSampleFileUrls.mock.calls.map(([, , fileType]) => fileType);
    expect(requested).toContain('segmentations_ome_zarr_zip');
  });

  it('initialises the selected sample (no infinite spinner) using the registered sample id', async () => {
    await renderPlot('xenium');

    expect(onSampleDefault).toHaveBeenCalledWith(sampleId);
  });

  it('replaces a saved sample that no longer exists (e.g. after an obj2s rerun)', async () => {
    await renderPlot('visium_hd', { ...config, selectedSample: 'sample-from-previous-run' });

    expect(onSampleDefault).toHaveBeenCalledWith(sampleId);
  });

  it('keeps a saved sample that still exists', async () => {
    await renderPlot('visium_hd', { ...config, selectedSample: sampleId });

    expect(onSampleDefault).not.toHaveBeenCalled();
  });

  it('treats a spatial object without a tissue image as imageless', async () => {
    getSampleFileUrls.mockRejectedValue(new Error('404 Not Found'));

    await renderPlot('seurat_spatial_object');

    expect(onSampleDefault).toHaveBeenCalledWith(sampleId);
  });

  it('takes the samples of an obj2s object without segmentations from its sample cell sets', async () => {
    getSampleFileUrls.mockRejectedValue(new Error('404 Not Found'));
    const cellSets = getCellSets()();
    cellSets.hierarchy = [{ key: 'sample', children: [{ key: 'sample-cell-set' }] }];

    await renderPlot('xenium', config, 'SUCCEEDED');
    cellSets.hierarchy = [];

    expect(onSampleDefault).toHaveBeenCalledWith('sample-cell-set');
  });

  it('does fetch the tissue image for a non-imageless spatial tech (visium_hd)', async () => {
    await renderPlot('visium_hd');

    const requested = getSampleFileUrls.mock.calls.map(([, , fileType]) => fileType);
    expect(requested).toContain('ome_zarr_zip');
  });
});
