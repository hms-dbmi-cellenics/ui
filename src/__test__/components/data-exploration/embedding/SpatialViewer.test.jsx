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
import { ZipFileStore } from '@zarrita/storage';

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

const mockStore = configureMockStore([thunk]);
let component;
let store;

const width = 100;
const height = 200;
const experimentId = '1234';
const obj2sSampleId = 'obj2s-sample';
const sample1FileId = 'sample1';
const sample2FileId = 'sample2';

describe('SpatialViewer', () => {
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
    // gets sample file urls from single obj2s sample id
    expect(getSampleFileUrls).toHaveBeenCalledTimes(1);

    // creates zip file store and zarrRoot from each of the two returned urls
    expect(ZipFileStore.fromUrl).toHaveBeenCalledTimes(2);
    expect(zarrRoot).toHaveBeenCalledTimes(2);

    // loads a single grid from the two roots
    expect(loadOmeZarrGrid).toHaveBeenCalledTimes(1);
  });

  it('renders correctly with initial data', () => {
    const spatial = component.find('SpatialViewer');
    expect(spatial.length).toEqual(1);

    expect(component.find(CrossHair).length).toEqual(0);
    expect(component.find(CellInfo).length).toEqual(0);
  });
});
