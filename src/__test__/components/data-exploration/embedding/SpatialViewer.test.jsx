import React from 'react';
import { Provider } from 'react-redux';
import { act } from 'react-dom/test-utils';
import { mount } from 'enzyme';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import preloadAll from 'jest-next-dynamic';
import SpatialViewer from 'components/data-exploration/spatial/SpatialViewer';
import { loadOmeZarrGrid } from 'components/data-exploration/spatial/loadOmeZarr';
import CrossHair from 'components/data-exploration/embedding/CrossHair';
import CellInfo from 'components/data-exploration/CellInfo';
import { getSampleFileUrls } from 'utils/data-management/downloadSampleFile';
import { initialEmbeddingState } from 'redux/reducers/embeddings/initialState';
import { root as zarrRoot } from 'zarrita';
import { initialComponentConfigStates } from 'redux/reducers/componentConfig/initialState';
import PipelineStatus from 'utils/pipelineStatusValues';
import '__test__/test-utils/setupTests';
import ExpressionMatrix from 'utils/ExpressionMatrix/ExpressionMatrix';
import ZipFileStore from 'components/data-exploration/spatial/ZipFileStore';
import { loadMoleculeMeta } from 'utils/spatial/loadMoleculeNodes';

jest.mock('utils/data-management/downloadSampleFile', () => ({
  getSampleFileUrls: jest.fn(),
}));

jest.mock('components/data-exploration/spatial/loadOmeZarr', () => ({
  loadOmeZarrGrid: jest.fn(() => Promise.resolve({
    data: 'mockPyramidData',
    metadata: 'mockMetadata',
    shape: [3, 256, 256],
  })),
}));

jest.mock('components/data-exploration/spatial/ZipFileStore', () => ({
  fromUrl: jest.fn(),
}));

jest.mock('utils/spatial/loadMoleculeNodes', () => ({
  __esModule: true,
  default: jest.fn(() => Promise.resolve({
    x: new Float32Array(0), y: new Float32Array(0), featureCode: new Int32Array(0), count: 0,
  })),
  loadMoleculeMeta: jest.fn(() => Promise.resolve({
    maxDepth: 0,
    genes: [{ code: 0, gene: 'Gad1', color: '#1f77b4' }],
  })),
}));

const mockStore = configureMockStore([thunk]);
let component;
let store;

const width = 100;
const height = 200;
const experimentId = '1234';
const obj2sSampleId = 'obj2s-sample';
const sample1FileId = 'sample1';
const sample2FileId = 'sample2';

const initialState = {
  componentConfig: {
    ...initialComponentConfigStates,
  },
  backendStatus: {
    [experimentId]: {
      status: {
        obj2s: {
          shouldRerun: false,
          status: PipelineStatus.SUCCEEDED,

        },
      },
    },
  },
  embeddings: {
    images: {
      ...initialEmbeddingState,
      loading: false,
      data: [[-13, 32], [6, 7], [43, 9], [57, 3]],
    },
  },
  cellSets: {
    properties: {
      louvain: {
        name: 'Louvain clusters',
        color: undefined,
      },
      cluster1: {
        color: '#0000ff',
        cellIds: new Set([0, 3]),
      },
      cluster2: {
        color: '#ff0000',
        cellIds: new Set([1, 2]),
      },
      [sample1FileId]: {
        cellIds: new Set([0, 1]),
      },
      [sample2FileId]: {
        cellIds: new Set([2, 3]),
      },
    },
    hierarchy: [
      {
        key: 'louvain',
        children: [{ key: 'cluster1' }, { key: 'cluster2' }],
      },
    ],
    hidden: new Set(),
  },
  genes: {
    expression: {
      full: {
        loading: false,
        matrix: new ExpressionMatrix(),
      },
    },
  },
  cellInfo: {
    cellId: 2,
    focus: {
      store: 'cellSets',
      key: 'louvain',
    },
  },
  experimentSettings: {
    info: {
      sampleIds: [obj2sSampleId],
    },
  },
};

describe('SpatialViewer', () => {
  beforeAll(async () => {
    await preloadAll();
  });

  beforeEach(async () => {
    getSampleFileUrls.mockResolvedValue([
      { url: 'http://example.com/sample1.ome.zarr.zip', fileId: sample1FileId },
      { url: 'http://example.com/sample2.ome.zarr.zip', fileId: sample2FileId },
    ]);

    store = mockStore(initialState);

    await act(() => {
      component = mount(
        <Provider store={store}>
          <SpatialViewer experimentId={experimentId} width={width} height={height} />
        </Provider>,
      );
    });
  });

  afterEach(() => {
    component.unmount();
  });

  it('fetches sample file URLs and processes them', () => {
    // fetches the image (ome_zarr_zip), segmentation (segmentations_ome_zarr_zip)
    // and optional molecules (molecules_by_gene) file URLs for the obj2s sample
    const requestedFileTypes = getSampleFileUrls.mock.calls.map(([, , fileType]) => fileType);
    expect(requestedFileTypes).toEqual(
      expect.arrayContaining(['ome_zarr_zip', 'segmentations_ome_zarr_zip', 'molecules_by_gene']),
    );

    // a zip store + zarr root per returned url, for both the image and segmentation grids
    // (roots are memoised by url, so regrouping rebuilds the grid without re-opening stores)
    expect(zarrRoot).toHaveBeenCalledTimes(4);

    // loads a grid for the image (emptyFill undefined) and one for the segmentations
    // (emptyFill 0). The grid may be rebuilt when the sample grouping resolves, so
    // assert both grids load rather than an exact call count.
    const emptyFillArgs = loadOmeZarrGrid.mock.calls.map((call) => call[2]);
    expect(emptyFillArgs).toContain(undefined); // image grid
    expect(emptyFillArgs).toContain(0); // segmentation grid
  });

  it('renders correctly with initial data', () => {
    const spatial = component.find('SpatialViewer');
    expect(spatial.length).toEqual(1);

    expect(component.find(CrossHair).length).toEqual(0);
    expect(component.find(CellInfo).length).toEqual(0);
  });
});

describe('SpatialViewer — imageless technology (e.g. Xenium)', () => {
  const xeniumSampleId = 'xenium-sample';

  const imagelessState = {
    ...initialState,
    samples: {
      [xeniumSampleId]: { id: xeniumSampleId, type: 'xenium' },
    },
    cellSets: {
      ...initialState.cellSets,
      properties: {
        ...initialState.cellSets.properties,
        [xeniumSampleId]: { cellIds: new Set([0, 1, 2, 3]) },
      },
    },
    experimentSettings: {
      info: { sampleIds: [xeniumSampleId] },
    },
  };

  beforeAll(async () => {
    await preloadAll();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    getSampleFileUrls.mockResolvedValue([
      { url: 'http://example.com/segmentations.ome.zarr.zip', fileId: xeniumSampleId },
    ]);

    store = mockStore(imagelessState);

    await act(() => {
      component = mount(
        <Provider store={store}>
          <SpatialViewer experimentId={experimentId} width={width} height={height} />
        </Provider>,
      );
    });
  });

  afterEach(() => {
    component.unmount();
  });

  it('skips the tissue-image (ome_zarr_zip) fetch entirely', () => {
    const requestedFileTypes = getSampleFileUrls.mock.calls.map(([, , fileType]) => fileType);
    expect(requestedFileTypes).not.toContain('ome_zarr_zip');
  });

  it('still fetches the segmentation OME-Zarr', () => {
    const requestedFileTypes = getSampleFileUrls.mock.calls.map(([, , fileType]) => fileType);
    expect(requestedFileTypes).toContain('segmentations_ome_zarr_zip');
  });

  it('renders without an image loader (does not crash on the absent image)', () => {
    expect(component.find('SpatialViewer').length).toEqual(1);
  });
});

describe('SpatialViewer — molecule (transcript) overlay', () => {
  const xeniumSampleId = 'xenium-sample';

  const baseMoleculeState = {
    ...initialState,
    samples: {
      [xeniumSampleId]: { id: xeniumSampleId, type: 'xenium' },
    },
    cellSets: {
      ...initialState.cellSets,
      properties: {
        ...initialState.cellSets.properties,
        [xeniumSampleId]: { cellIds: new Set([0, 1, 2, 3]) },
      },
    },
    experimentSettings: {
      info: { sampleIds: [xeniumSampleId] },
    },
  };

  // Resolve a distinct payload per requested file type so the molecules_by_gene
  // URL is real (not shared with the segmentation URL).
  const mockUrlsByType = (hasMolecules) => {
    getSampleFileUrls.mockImplementation((_e, _s, fileType) => {
      if (fileType === 'molecules_by_gene') {
        return hasMolecules
          ? Promise.resolve([{ url: 'http://example.com/molecules.bygene.zip', fileId: xeniumSampleId }])
          : Promise.reject(new Error('404'));
      }
      return Promise.resolve([
        { url: 'http://example.com/segmentations.ome.zarr.zip', fileId: xeniumSampleId },
      ]);
    });
  };

  beforeAll(async () => { await preloadAll(); });
  afterEach(() => { component.unmount(); });

  const mountWith = async (state) => {
    store = mockStore(state);
    await act(() => {
      component = mount(
        <Provider store={store}>
          <SpatialViewer experimentId={experimentId} width={width} height={height} />
        </Provider>,
      );
    });
  };

  it('does not build a molecule store when the sample has no molecule artifact', async () => {
    jest.clearAllMocks();
    mockUrlsByType(false);
    ZipFileStore.fromUrl.mockReturnValue({ get: jest.fn() });
    await mountWith({
      ...baseMoleculeState,
      componentConfig: {
        ...initialComponentConfigStates,
        interactiveSpatial: {
          ...initialComponentConfigStates.interactiveSpatial,
          config: {
            ...initialComponentConfigStates.interactiveSpatial.config,
            showMolecules: true,
          },
        },
      },
    });
    // molecule fetch rejected => no molecule artifact store/meta loaded
    expect(loadMoleculeMeta).not.toHaveBeenCalled();
  });

  it('builds a molecule store + loads meta when a molecule artifact is present', async () => {
    jest.clearAllMocks();
    mockUrlsByType(true);
    ZipFileStore.fromUrl.mockReturnValue({ get: jest.fn() });
    await mountWith({
      ...baseMoleculeState,
      componentConfig: {
        ...initialComponentConfigStates,
        interactiveSpatial: {
          ...initialComponentConfigStates.interactiveSpatial,
          config: {
            ...initialComponentConfigStates.interactiveSpatial.config,
            showMolecules: true,
          },
        },
      },
    });

    const moleculeStoreUrls = ZipFileStore.fromUrl.mock.calls
      .map(([url]) => url)
      .filter((url) => url.includes('molecules.bygene.zip'));
    expect(moleculeStoreUrls).toHaveLength(1);
    expect(loadMoleculeMeta).toHaveBeenCalled();
  });
});
