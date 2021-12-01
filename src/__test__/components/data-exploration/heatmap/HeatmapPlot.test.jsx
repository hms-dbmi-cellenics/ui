import _ from 'lodash';
import React from 'react';
import { mount } from 'enzyme';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import { Empty } from 'antd';

import Environment from 'utils/environment';

// eslint-disable-next-line import/no-named-as-default
import HeatmapPlot from 'components/data-exploration/heatmap/HeatmapPlot';
import VegaHeatmap from 'components/data-exploration/heatmap/VegaHeatmap';

import { getFromApiExpectOK } from 'utils/getDataExpectOK';
import mockCellSets from 'utils/tests/mockStores/cellSets';

import { CELL_SETS_LOADING } from 'redux/actionTypes/cellSets';
import { getCellSets, getCellSetsHierarchyByKeys, getBackendStatus } from 'redux/selectors';
import { loadMarkerGenes } from 'redux/actions/genes';

import '__test__/test-utils/setupTests';

jest.mock('components/data-exploration/heatmap/VegaHeatmap');
jest.mock('utils/getDataExpectOK');
jest.mock('redux/selectors');

jest.mock('redux/actions/genes/loadMarkerGenes');
loadMarkerGenes.mockImplementation(() => async () => { });

VegaHeatmap.mockImplementation(() => <div>Mocked Vega Heatmap</div>);
enableFetchMocks();

getFromApiExpectOK.mockImplementation(() => ({ worker: { started: true, ready: true } }));

const mockStore = configureStore([thunk]);

let component;

const componentType = 'interactiveHeatmap';

const experimentId = '123';
const initialState = {
  genes: {
    expression: {
      loading: [],
      data: {
        REALGENE: {
          min: 0,
          max: 1.6,
          expression: [0, 0.4, 0.5, 1.6],
        },
        REALGENE2: {
          min: 0,
          max: 1.6,
          expression: [0, 0.4, 0.5, 1.6],
        },
        REALGENE3: {
          min: 0,
          max: 1.6,
          expression: [0, 0.4, 0.5, 1.6],
        },
      },
      views: {
        [componentType]: {
          data: ['REALGENE'],
          fetching: false,
          error: false,
        },
      },
    },
    markers: {
      loading: false,
      error: false,
    },
  },
  cellSets: {
    hierarchy: [
      {
        key: 'louvain',
        children: [
          {
            key: 'louvain-0',
          },
          {
            key: 'louvain-1',
          },
        ],
      },
    ],
    properties: {
      louvain: {
        name: 'louvain clusters',
      },
      'louvain-0': {
        name: 'louvain 0',
        cellIds: new Set([5, 6, 7]),
      },
      'louvain-1': {
        name: 'louvain 1',
        cellIds: new Set([1, 2, 3]),
      },
    },
    hidden: new Set([5]),
  },
  cellInfo: {},
  componentConfig: {
    interactiveHeatmap: {
      config: {
        groupedTracks: ['sample'],
        selectedTracks: ['louvain'],
      },
    },
  },
  experimentSettings: {
    info: {
      sampleIds: [],
    },
    processing: {
      meta: {
        loading: false,
      },
    },
  },
  backendStatus: {
    [experimentId]: { status: {} },
  },
};

describe('HeatmapPlot', () => {
  beforeEach(() => {
    const response = new Response(JSON.stringify({}));

    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockResolvedValue(response);

    getCellSets.mockReturnValue(() => mockCellSets().cellSets);

    getBackendStatus.mockReturnValue(() => ({
      loading: false,
      error: false,
      status: { pipeline: { completedSteps: [] } },
    }));

    getCellSetsHierarchyByKeys.mockReturnValue(() => (
      [{
        key: 'louvain',
        name: 'louvain clusters',
        type: 'cellSets',
        children: [
          {
            key: 'louvain-0',
          },
          {
            key: 'louvain-1',
          },
          {
            key: 'louvain-2',
          },
          {
            key: 'louvain-3',
          },
          {
            key: 'louvain-4',
          },
          {
            key: 'louvain-5',
          },
          {
            key: 'louvain-6',
          },
          {
            key: 'louvain-7',
          },
        ],
      }]));
  });

  afterEach(() => {
    component.unmount();
    jest.clearAllMocks();
  });

  it('renders Empty component when no selected gene', () => {
    const store = mockStore({
      ...initialState,
      genes: {
        ...initialState.genes,
        expression: {
          ...initialState.genes.expression,
          views: {
            ...initialState.genes.expression.views,
            [componentType]: {
              ...initialState.genes.expression.views[componentType],
              fetching: false,
              error: false,
              data: [],
            },
          },
          loading: [],
        },
      },
    });

    component = mount(
      <Provider store={store}>
        <HeatmapPlot experimentId={experimentId} width={200} height={200} />
      </Provider>,
    );
    expect(component.find('HeatmapPlot').length).toEqual(1);
    expect(component.find(Empty).length).toEqual(1);
  });

  it('renders Spinner when no expression data', () => {
    const store = mockStore({
      ...initialState,
      genes: {
        ...initialState.genes,
        expression: {
          ...initialState.genes.expression,
          views: {
            ...initialState.genes.expression.views,
            [componentType]: {
              ...initialState.genes.expression.views[componentType],
              fetching: true,
              error: false,
              data: ['REALGENE'],
            },
          },
          loading: ['REALGENE'],
        },
      },
    });

    component = mount(
      <Provider store={store}>
        <HeatmapPlot experimentId={experimentId} width={200} height={200} />
      </Provider>,
    );
    expect(component.find('HeatmapPlot').length).toEqual(1);
    expect(component.find('Loader').length).toEqual(2);
  });

  it('renders Vega heatmap when genes loaded', () => {
    const store = mockStore(initialState);
    component = mount(
      <Provider store={store}>
        <HeatmapPlot experimentId={experimentId} width={200} height={200} />
      </Provider>,
    );
    expect(component.find('HeatmapPlot').length).toEqual(1);
    expect(component.find('VegaHeatmap').length).toEqual(1);
  });

  it('renders error state when expression data errors out', () => {
    const store = mockStore({
      ...initialState,
      genes: {
        ...initialState.genes,
        expression: {
          ...initialState.genes.expression,
          error: 'wow, error!',
        },
      },
    });

    component = mount(
      <Provider store={store}>
        <HeatmapPlot experimentId={experimentId} width={200} height={200} />
      </Provider>,
    );

    expect(component.find('HeatmapPlot').length).toEqual(1);
    expect(component.find(Empty).length).toEqual(1);
  });

  it('renders error state when the view errors out', () => {
    const store = mockStore({
      ...initialState,
      genes: {
        ...initialState.genes,
        expression: {
          ...initialState.genes.expression,
          views: {
            ...initialState.genes.expression.views,
            [componentType]: {
              ...initialState.genes.expression.views[componentType],
              error: true,
            },
          },
        },
      },
    });

    component = mount(
      <Provider store={store}>
        <HeatmapPlot experimentId={experimentId} width={200} height={200} />
      </Provider>,
    );

    expect(component.find('HeatmapPlot').length).toEqual(1);
    expect(component.find(Empty).length).toEqual(1);
  });

  it('Shows Empty if cell sets is empty', () => {
    getCellSets.mockReturnValue(() => ({
      ...initialState.cellSets,
      hierarchy: [],
      properties: [],
      loading: false,
      error: false,
    }));

    const store = mockStore({ ...initialState });

    component = mount(
      <Provider store={store}>
        <HeatmapPlot experimentId={experimentId} width={200} height={200} />
      </Provider>,
    );

    expect(component.find('VegaHeatmap').length).toEqual(0);
    expect(component.find(Empty).length).toEqual(1);
  });

  it('dispatches loadCellSets action when no cell sets are in the store', () => {
    const store = mockStore({
      ...initialState,
      cellSets: {
        ...initialState.cellSets,
        hierarchy: [],
        properties: [],
        loading: false,
        error: true,
      },
    });

    component = mount(
      <Provider store={store}>
        <HeatmapPlot experimentId={experimentId} width={200} height={200} />
      </Provider>,
    );

    expect(component.find('HeatmapPlot').length).toEqual(1);
    expect(store.getActions().length).toEqual(1);
    const [loadAction] = store.getActions();

    expect(loadAction.type).toBe(CELL_SETS_LOADING);
    expect(loadAction).toMatchSnapshot();
  });

  it('loads marker genes if it can', async () => {
    const store = mockStore({
      ...initialState,
      networkResources: { environment: Environment.DEVELOPMENT },
      cellSets: {
        ...initialState.cellSets,
        loading: true,
        error: false,
      },
      genes: {
        ...initialState.genes,
        expression: {
          ...initialState.genes.expression,
          loading: false,
          error: 'Some error',
        },
      },
      experimentSettings: {
        ...initialState.experimentSettings,
        processing: {
          ...initialState.processing,
          configureEmbedding: {
            clusteringSettings: { methodSettings: { louvain: { resolution: 10 } } },
          },
        },
      },
    });

    component = mount(
      <Provider store={store}>
        <HeatmapPlot experimentId={experimentId} width={200} height={200} />
      </Provider>,
    );

    expect(component.find('HeatmapPlot').length).toEqual(1);

    const expectedMarkerGenes = 5;

    expect(loadMarkerGenes).toHaveBeenCalledWith('123', 10, 'interactiveHeatmap', expectedMarkerGenes);
  });

  it('loads marker genes with a different amount of marker genes if louvain clusters are many', async () => {
    const store = mockStore({
      ...initialState,
      networkResources: { environment: Environment.DEVELOPMENT },
      cellSets: {
        ...initialState.cellSets,
        loading: true,
        error: false,
      },
      genes: {
        ...initialState.genes,
        expression: {
          ...initialState.genes.expression,
          loading: false,
          error: 'Some error',
        },
      },
      experimentSettings: {
        ...initialState.experimentSettings,
        processing: {
          ...initialState.processing,
          configureEmbedding: {
            clusteringSettings: { methodSettings: { louvain: { resolution: 10 } } },
          },
        },
      },
    });

    const louvainClusters = _.range(60).map((clusterIndex) => ({ key: `louvain-${clusterIndex}` }));
    getCellSetsHierarchyByKeys.mockReturnValue(() => (
      [{
        key: 'louvain',
        name: 'louvain clusters',
        type: 'cellSets',
        children: louvainClusters,
      }]));

    component = mount(
      <Provider store={store}>
        <HeatmapPlot experimentId={experimentId} width={200} height={200} />
      </Provider>,
    );

    expect(component.find('HeatmapPlot').length).toEqual(1);

    const expectedMarkerGenes = 3;

    expect(loadMarkerGenes).toHaveBeenCalledWith('123', 10, 'interactiveHeatmap', expectedMarkerGenes);
  });
});
