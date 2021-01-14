import React from 'react';
import { configure, mount } from 'enzyme';
import { Provider } from 'react-redux';
import Adapter from 'enzyme-adapter-react-16';
import thunk from 'redux-thunk';
import configureMockStore from 'redux-mock-store';
import { ExclamationCircleFilled } from '@ant-design/icons';
import HeatmapPlot from '../../../../../../../pages/experiments/[experimentId]/data-exploration/components/heatmap/HeatmapPlot';
import VegaHeatmap from '../../../../../../../pages/experiments/[experimentId]/data-exploration/components/heatmap/VegaHeatmap';

import { CELL_SETS_LOADING } from '../../../../../../../redux/actionTypes/cellSets';

jest.mock('localforage');
jest.mock('../../../../../../../pages/experiments/[experimentId]/data-exploration/components/heatmap/VegaHeatmap');
VegaHeatmap.mockImplementation(() => <div>Mocked Vega Heatmap</div>);

const mockStore = configureMockStore([thunk]);
configure({ adapter: new Adapter() });
let component;
const componentType = 'InteractiveHeatmap';

const initialState = {
  genes: {
    expression: {
      loading: ['A'],
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
        cellIds: [5, 6, 7],
      },
      'louvain-1': {
        name: 'louvain 1',
        cellIds: [1, 2, 3],
      },
    },
    hidden: new Set([5]),
  },
  cellInfo: {},
  componentConfig: {
    interactiveHeatmap: {
      config: {
        groupedTrack: 'sample',
        selectedTracks: ['louvain'],
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
    expect(component.find('Empty').length).toEqual(2);
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
    expect(component.find('Spin').length).toEqual(1);
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
    expect(component.find(ExclamationCircleFilled).length).toEqual(1);
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
    expect(component.find(ExclamationCircleFilled).length).toEqual(1);
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
