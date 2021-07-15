import React from 'react';
import { configure, mount } from 'enzyme';
import { Provider } from 'react-redux';
import Adapter from 'enzyme-adapter-react-16';
import thunk from 'redux-thunk';
import configureMockStore from 'redux-mock-store';
import { enableFetchMocks } from 'jest-fetch-mock';
import { Empty } from 'antd';
// eslint-disable-next-line import/no-named-as-default
import HeatmapPlot from '../../../../components/data-exploration/heatmap/HeatmapPlot';
import VegaHeatmap from '../../../../components/data-exploration/heatmap/VegaHeatmap';

import { CELL_SETS_LOADING } from '../../../../redux/actionTypes/cellSets';

jest.mock('localforage');
jest.mock('../../../../components/data-exploration/heatmap/VegaHeatmap');
VegaHeatmap.mockImplementation(() => <div>Mocked Vega Heatmap</div>);
enableFetchMocks();

const mockStore = configureMockStore([thunk]);
configure({ adapter: new Adapter() });
let component;
const componentType = 'interactiveHeatmap';

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
    processing: {
      meta: {
        loading: false,
      },
    },
  },
};

describe('HeatmapPlot', () => {
  afterEach(() => {
    component.unmount();
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
        <HeatmapPlot experimentId='123' width={200} height={200} />
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
        <HeatmapPlot experimentId='123' width={200} height={200} />
      </Provider>,
    );
    expect(component.find('HeatmapPlot').length).toEqual(1);
    expect(component.find('Loader').length).toEqual(2);
  });

  it('renders Vega heatmap when genes loaded', () => {
    const store = mockStore(initialState);
    component = mount(
      <Provider store={store}>
        <HeatmapPlot experimentId='123' width={200} height={200} />
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
        <HeatmapPlot experimentId='123' width={200} height={200} />
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
        <HeatmapPlot experimentId='123' width={200} height={200} />
      </Provider>,
    );

    expect(component.find('HeatmapPlot').length).toEqual(1);
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
        <HeatmapPlot experimentId='123' width={200} height={200} />
      </Provider>,
    );

    expect(component.find('HeatmapPlot').length).toEqual(1);
    expect(store.getActions().length).toEqual(1);
    const [loadAction] = store.getActions();

    expect(loadAction.type).toBe(CELL_SETS_LOADING);
    expect(loadAction).toMatchSnapshot();
  });
});
