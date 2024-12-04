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
import { CELL_SETS_CREATE } from 'redux/actionTypes/cellSets';
import { initialEmbeddingState } from 'redux/reducers/embeddings/initialState';
import { ZipFileStore } from '@zarrita/storage';
import { root as zarrRoot } from 'zarrita';
import { initialComponentConfigStates } from 'redux/reducers/componentConfig/initialState';
import PipelineStatus from 'utils/pipelineStatusValues';
import generateExperimentSettingsMock from '__test__/test-utils/experimentSettings.mock';
import { CELL_INFO_UPDATE } from 'redux/actionTypes/cellInfo';
import '__test__/test-utils/setupTests';
import ExpressionMatrix from 'utils/ExpressionMatrix/ExpressionMatrix';

jest.mock('utils/data-management/downloadSampleFile', () => ({
  getSampleFileUrls: jest.fn(),
}));

jest.mock('@zarrita/storage', () => ({
  ...jest.requireActual('@zarrita/storage'),
  ZipFileStore: {
    fromUrl: jest.fn(),
  },
}));

jest.mock('zarrita', () => ({
  ...jest.requireActual('zarrita'),
  root: jest.fn(() => ({
    // Mock any additional methods or properties needed
    getHierarchy: jest.fn(() => Promise.resolve({})),
  })),
}));

jest.mock('components/data-exploration/spatial/loadOmeZarr', () => ({
  loadOmeZarrGrid: jest.fn(() => Promise.resolve({
    data: 'mockPyramidData',
    metadata: 'mockMetadata',
    shape: [256, 256],
  })),
}));

const mockStore = configureMockStore([thunk]);
let component;
let store;

const width = 100;
const height = 200;
const experimentId = '1234';
const obj2sSampleId = 'obj2s-sample';

const initialExperimentState = generateExperimentSettingsMock([]);

jest.mock('next/dynamic', () => () => (props) => 'I am a spatial');

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
        data: {
          obsCentroids: [[-13, 32], [6, 7], [43, 9], [57, 3]],
          obsCentroidsIndex: [0, 1, 2, 3],
          centroidColors: { 0: '#ff0000', 1: '#00ff00' },
        },
      },
    },
    cellSets: {
      properties: {
        sample: {
          name: 'Sample clusters',
          color: undefined,
        },
      },
      hierarchy: [
        { key: 'sample', children: [] },
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
        key: 'sample',
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

  beforeEach(() => {
    getSampleFileUrls.mockResolvedValue([
      { url: 'http://example.com/sample1.ome.zarr.zip', fileId: 'fileId1' },
      { url: 'http://example.com/sample2.ome.zarr.zip', fileId: 'fileId2' },
    ]);

    store = mockStore(initialState);
    component = mount(
      <Provider store={store}>
        <SpatialViewer experimentId={experimentId} width={width} height={height} />
      </Provider>,
    );
  });

  afterEach(() => {
    component.unmount();
  });

  it('fetches sample file URLs and processes them', async () => {
    await act(async () => {
      component.update();
    });

    expect(getSampleFileUrls).toHaveBeenCalledWith(expect.any(String), expect.any(String), 'ome_zarr_zip');
    expect(ZipFileStore.fromUr).toHaveBeenCalled(); // Ensure zarrRoot is called
    expect(zarrRoot).toHaveBeenCalled(); // Ensure zarrRoot is called
    expect(loadOmeZarrGrid).toHaveBeenCalled(); // Ensure loadOmeZarrGrid is called
    // Add assertions to verify that component processed the URLs correctly
  });

  it('renders correctly with initial data', () => {
    const spatial = component.find('SpatialViewer');
    expect(spatial.length).toEqual(1);

    expect(component.find(CrossHair).length).toEqual(0);
    expect(component.find(CellInfo).length).toEqual(0);
  });

  it('renders popover on cell selection and closes on cancel', () => {
    expect(component.find('ClusterPopover').length).toEqual(0);

    const selectedCellIds = new Set([1, 2]);
    act(() => {
      component.find('div.vitessce-container').props().setCellSelection(selectedCellIds);
    });
    component.update();

    let popover = component.find('ClusterPopover');
    expect(popover.length).toEqual(1);

    // Close the popover
    act(() => {
      popover.getElement().props.onCancel();
    });
    component.update();
    popover = component.find('ClusterPopover');
    expect(popover.length).toEqual(0);
    expect(store.getActions().length).toEqual(0);
  });

  it('highlights cells on hover', () => {
    act(() => {
      component.find('div.vitessce-container').props().setCellHighlight(1);
    });

    expect(store.getActions().length).toEqual(1);
    expect(store.getActions()[0].type).toEqual(CELL_INFO_UPDATE);
    expect(store.getActions()[0].payload.cellId).toEqual(1);
  });

  it('creates a new cluster on popover create action', () => {
    const selectedCellIds = new Set([1, 2]);
    act(() => {
      component.find('div.vitessce-container').props().setCellSelection(selectedCellIds);
    });
    component.update();

    const popover = component.find('ClusterPopover');

    // Emulate clicking create
    act(() => {
      popover.getElement().props.onCreate();
    });
    component.update();

    expect(store.getActions().length).toEqual(1);
    expect(store.getActions()[0].type).toEqual(CELL_SETS_CREATE);
    expect(store.getActions()[0].payload.cellIds).toEqual(selectedCellIds);
  });
});
