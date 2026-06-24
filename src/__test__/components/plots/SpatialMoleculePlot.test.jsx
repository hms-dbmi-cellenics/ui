import React from 'react';
import { Provider } from 'react-redux';
import { act } from 'react-dom/test-utils';
import { render, screen, waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import SpatialMoleculePlot from 'components/plots/SpatialMoleculePlot';
import { getSampleFileUrls } from 'utils/data-management/downloadSampleFile';
import loadMoleculeNodes, { loadMoleculeMeta } from 'utils/spatial/loadMoleculeNodes';
import { MOLECULE_PALETTE } from 'utils/spatial/moleculeColors';
import { loadOmeZarrGrid } from 'components/data-exploration/spatial/loadOmeZarr';

// capture the props deck.gl is rendered with (layers, viewState, handlers)
let deckProps = {};
jest.mock('next/dynamic', () => () => (props) => {
  deckProps = props;
  return <div data-testid='deckgl' />;
});

jest.mock('utils/data-management/downloadSampleFile', () => ({
  getSampleFileUrls: jest.fn(),
}));

jest.mock('utils/spatial/loadMoleculeNodes', () => ({
  __esModule: true,
  default: jest.fn(),
  loadMoleculeMeta: jest.fn(),
}));

jest.mock('components/data-exploration/spatial/loadOmeZarr', () => ({
  loadOmeZarrGrid: jest.fn(),
}));

// reuse a simple filterCells stub — the grey LUT just needs a Set of cell ids
jest.mock('utils/plotSpecs/generateSpatialFeatureSpec', () => ({
  filterCells: jest.fn(() => new Set([1, 2])),
}));

jest.mock('redux/actions/cellSets', () => ({
  loadCellSets: jest.fn(() => ({ type: 'cellSets/loading' })),
}));

jest.mock('redux/actions/genes/loadGeneList', () => ({
  __esModule: true,
  default: jest.fn(() => ({ type: 'genes/loadList' })),
}));

jest.mock('redux/selectors', () => ({
  getCellSets: () => () => ({ accessible: true, hierarchy: [], properties: {} }),
}));

jest.mock('components/data-exploration/spatial/ZipFileStore', () => ({
  __esModule: true,
  default: { fromUrl: jest.fn(() => ({ get: jest.fn() })) },
}));

jest.mock('zarrita', () => ({ root: jest.fn((s) => s) }));

// deck.gl core/layers are WebGL — stub the constructors we use so the component
// builds plain capturable objects instead of real GPU layers. These need `new`
// + `this`, so they're genuine function expressions (not arrow callbacks).
/* eslint-disable prefer-arrow-callback, func-names, object-shorthand */
jest.mock('@deck.gl/core', () => ({
  OrthographicView: jest.fn(function () {}),
  OrthographicViewport: jest.fn(function () {
    this.unproject = ([x, y]) => [x, y];
    this.project = ([x, y]) => [x, y];
  }),
  COORDINATE_SYSTEM: { CARTESIAN: 'cartesian' },
}));

jest.mock('@deck.gl/layers', () => ({
  ScatterplotLayer: jest.fn(function (opts) {
    return { ...opts, scatterLayer: true };
  }),
}));
/* eslint-enable prefer-arrow-callback, func-names, object-shorthand */

jest.mock('components/data-exploration/spatial/bitmaskLayers', () => ({
  BITMASK_LUT_SIZE: 16,
  makeBitmaskLayer: jest.fn((opts) => ({ ...opts, __bitmask: true })),
}));

const mockStore = configureMockStore([thunk]);
const experimentId = 'exp-1';
const sampleId = 'xenium-sample';

const baseConfig = {
  dimensions: { width: 500, height: 500 },
  legend: { enabled: true },
  axes: {},
  selectedGenes: [],
  geneColors: {},
  showSegmentationOutlines: true,
  selectedSample: sampleId,
};

const buildState = (config) => ({
  experimentSettings: { info: { sampleIds: [sampleId] } },
  backendStatus: { [experimentId]: { status: { obj2s: { status: 'NOT_CREATED' } } } },
  samples: { [sampleId]: { id: sampleId, type: 'xenium' } },
  componentConfig: { spatialMoleculesMain: { config } },
  // gene dispersions drive the default selection — Sst has the higher dispersion.
  genes: { properties: { data: { Gad1: { dispersions: 1 }, Sst: { dispersions: 9 } } } },
});

const renderPlot = async (configOverrides = {}, extraProps = {}) => {
  const config = { ...baseConfig, ...configOverrides };
  const { onDefaultGenes = jest.fn(), onDefaultColors = jest.fn() } = extraProps;
  await act(async () => {
    render(
      <Provider store={mockStore(buildState(config))}>
        <SpatialMoleculePlot
          experimentId={experimentId}
          config={config}
          onDefaultGenes={onDefaultGenes}
          onDefaultColors={onDefaultColors}
        />
      </Provider>,
    );
  });
};

const META = {
  version: 2,
  genes: [
    {
      code: 0, gene: 'Gad1', entry: '0.feather', nPoints: 1,
    },
    {
      code: 1, gene: 'Sst', entry: '1.feather', nPoints: 1,
    },
  ],
  rootExtent: { x: [0, 100], y: [0, 200] },
};

const layerById = (id) => (deckProps.layers ?? []).find((l) => l?.id === id);

describe('SpatialMoleculePlot', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    deckProps = {};
    getSampleFileUrls.mockResolvedValue([{ url: 'signed://molecules.zip', fileId: sampleId }]);
    loadMoleculeMeta.mockResolvedValue(META);
    loadOmeZarrGrid.mockResolvedValue({ data: [{ shape: [1, 200, 100] }] });
    loadMoleculeNodes.mockResolvedValue({
      x: Float32Array.from([1]),
      y: Float32Array.from([2]),
      featureCode: Int32Array.from([0]),
      count: 1,
    });
  });

  it('range-reads only the selected genes (no spatial/budget query args)', async () => {
    await renderPlot({ selectedGenes: ['Gad1'] });

    await waitFor(() => expect(loadMoleculeNodes).toHaveBeenCalled());
    const callArgs = loadMoleculeNodes.mock.calls[0][1];
    // only the requested gene's feature_code — the gene-partitioned reader needs
    // no bbox/depth/budget (those are gone with the quadtree)
    expect(callArgs.genes).toEqual([0]);
    expect(callArgs.bbox).toBeUndefined();
    expect(callArgs.depth).toBeUndefined();
    expect(callArgs.maxPoints).toBeUndefined();
    expect(callArgs.maxRenderedPoints).toBeUndefined();
  });

  it('does not re-read molecules on zoom/pan — only persists the camera', async () => {
    const onZoomChange = jest.fn();
    await act(async () => {
      render(
        <Provider store={mockStore(buildState({ ...baseConfig, selectedGenes: ['Gad1'] }))}>
          <SpatialMoleculePlot
            experimentId={experimentId}
            config={{ ...baseConfig, selectedGenes: ['Gad1'] }}
            onZoomChange={onZoomChange}
          />
        </Provider>,
      );
    });

    await waitFor(() => expect(loadMoleculeNodes).toHaveBeenCalledTimes(1));

    // simulate a zoom gesture through the captured deck.gl handler
    await act(async () => {
      deckProps.onViewStateChange({ viewState: { target: [50, 100, 0], zoom: 3 } });
    });

    // camera persisted, but molecules are NOT re-read (still a single load)
    await waitFor(() => expect(onZoomChange).toHaveBeenCalled());
    expect(loadMoleculeNodes).toHaveBeenCalledTimes(1);
  });

  it('restores the persisted zoom region on mount (navigation/reload)', async () => {
    // a saved sub-region of the [0,100]x[0,200] full extent
    await renderPlot({
      selectedGenes: ['Gad1'],
      axesRanges: {
        xAxisAuto: false, xMin: 10, yMin: 20, xMax: 60, yMax: 120,
      },
    });

    await waitFor(() => expect(screen.getByTestId('deckgl')).toBeInTheDocument());
    // deck.gl mounts centred on the saved region (35, 70) — NOT the full-extent
    // centre (50, 100) it would fit to with no persisted zoom.
    await waitFor(() => expect(deckProps.initialViewState?.target).toEqual([35, 70, 0]));
  });

  it('fits the full extent when no zoom is persisted (xAxisAuto)', async () => {
    await renderPlot({ selectedGenes: ['Gad1'] });

    await waitFor(() => expect(screen.getByTestId('deckgl')).toBeInTheDocument());
    // full-extent centre of [0,100]x[0,200]
    await waitFor(() => expect(deckProps.initialViewState?.target).toEqual([50, 100, 0]));
  });

  it('renders a molecule ScatterplotLayer plus the grey segmentation outline layer', async () => {
    await renderPlot({ selectedGenes: ['Gad1'] });

    await waitFor(() => expect(screen.getByTestId('deckgl')).toBeInTheDocument());
    await waitFor(() => expect(layerById('molecules')).toBeDefined());

    const molecules = layerById('molecules');
    expect(molecules.scatterLayer).toBe(true);
    expect(molecules.data.length).toBe(1);

    await waitFor(() => expect(layerById('molecule-seg-outline')).toBeDefined());
    expect(layerById('molecule-seg-outline').showOutlineOnly).toBe(true);
    // there is no fill layer — only outlines are supported
    expect(layerById('molecule-seg-fill')).toBeUndefined();
  });

  it('omits the segmentation outline layer (and the OME-Zarr load) when outlines are off', async () => {
    await renderPlot({ selectedGenes: ['Gad1'], showSegmentationOutlines: false });

    await waitFor(() => expect(layerById('molecules')).toBeDefined());
    expect(layerById('molecule-seg-outline')).toBeUndefined();
    // the segmentation OME-Zarr is never loaded when outlines are off
    expect(loadOmeZarrGrid).not.toHaveBeenCalled();
  });

  it('seeds the top-DISPERSION panel genes (not alphabetical) when none are selected', async () => {
    const onDefaultGenes = jest.fn();
    await renderPlot({ selectedGenes: [] }, { onDefaultGenes });

    // Sst (dispersion 9) ranks above Gad1 (dispersion 1) → dispersion order, NOT
    // alphabetical (which would be ['Gad1','Sst']).
    await waitFor(() => expect(onDefaultGenes).toHaveBeenCalledWith(['Sst', 'Gad1']));
    // … and nothing is loaded while the selection is empty.
    expect(loadMoleculeNodes).not.toHaveBeenCalled();
    expect(screen.getByText(/Select one or more genes/i)).toBeInTheDocument();
  });

  it('defaults per-gene colours from the Polychrome palette (first available)', async () => {
    const onDefaultColors = jest.fn();
    await renderPlot({ selectedGenes: ['Gad1', 'Sst'], geneColors: {} }, { onDefaultColors });

    // first available palette colours, in selection order
    await waitFor(() => expect(onDefaultColors).toHaveBeenCalledWith({
      Gad1: MOLECULE_PALETTE[0],
      Sst: MOLECULE_PALETTE[1],
    }));
  });

  it('re-seeds a fresh colour for a gene whose colour was nulled (removed then re-added)', async () => {
    const onDefaultColors = jest.fn();
    // Gad1 carries a null colour (the removed-gene sentinel) — it must be reseeded
    // from the palette, not left null or given a stale value.
    await renderPlot({ selectedGenes: ['Gad1'], geneColors: { Gad1: null } }, { onDefaultColors });

    await waitFor(() => expect(onDefaultColors).toHaveBeenCalledWith({
      Gad1: MOLECULE_PALETTE[0],
    }));
  });

  it('wires the marker size config into the ScatterplotLayer radius', async () => {
    await renderPlot({ selectedGenes: ['Gad1'], marker: { size: 3, opacity: 8 } });

    await waitFor(() => expect(layerById('molecules')).toBeDefined());
    // marker.size maps 1:1 to the point radius in px
    expect(layerById('molecules').getRadius).toBe(3);
  });

  it('renders the title + axis tick labels in the chrome overlay', async () => {
    await renderPlot({ selectedGenes: ['Gad1'], title: { text: 'My Molecules', fontSize: 16 } });

    await waitFor(() => expect(screen.getByTestId('deckgl')).toBeInTheDocument());
    // title drawn as SVG text
    await waitFor(() => expect(screen.getByText('My Molecules')).toBeInTheDocument());
    // an axis tick label (origin) is present
    expect(screen.getAllByText('0').length).toBeGreaterThan(0);
  });

  it('offers a PNG/SVG export control', async () => {
    await renderPlot({ selectedGenes: ['Gad1'] });

    await waitFor(() => expect(screen.getByTestId('deckgl')).toBeInTheDocument());
    expect(screen.getByTitle('Export plot')).toBeInTheDocument();
  });
});
