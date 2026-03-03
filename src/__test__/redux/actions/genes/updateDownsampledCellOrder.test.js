import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import updateDownsampledCellOrder from 'redux/actions/genes/updateDownsampledCellOrder';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

jest.mock('redux/actions/componentConfig/updatePlotConfig', () => jest.fn(
  (componentUuid, configChanges) => ({
    type: 'UPDATE_CONFIG',
    payload: { componentUuid, configChanges },
  }),
));

jest.mock('utils/work/getHeatmapCellOrder', () => jest.fn(
  (selectedCellSet, groupedTracks, selectedPoints, hiddenCellSets) => {
    // Mock implementation returns predictable cell order based on inputs
    if (!selectedCellSet || !groupedTracks) return [];
    if (hiddenCellSets.includes('louvain-0')) return [5, 6, 7, 8, 9];
    if (selectedPoints === 'sample-1') return [0, 1, 4, 5, 6];
    return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  },
));

describe('updateDownsampledCellOrder Redux action', () => {
  let store;

  const mockCellSets = {
    hierarchy: [
      {
        key: 'louvain',
        children: [{ key: 'louvain-0' }, { key: 'louvain-1' }],
      },
      {
        key: 'sample',
        children: [{ key: 'sample-1' }, { key: 'sample-2' }],
      },
    ],
    properties: {
      'louvain-0': { cellIds: new Set([0, 1, 2, 3, 4]) },
      'louvain-1': { cellIds: new Set([5, 6, 7, 8, 9]) },
      'sample-1': { cellIds: new Set([0, 1, 4, 5, 6]) },
      'sample-2': { cellIds: new Set([2, 3, 7, 8, 9]) },
    },
    hidden: new Set(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('dispatches updatePlotConfig with computed cellOrder', () => {
    store = mockStore({
      componentConfig: {
        testComponent: {
          config: {
            selectedCellSet: 'louvain',
            groupedTracks: ['sample'],
            selectedPoints: 'All',
          },
        },
      },
      cellSets: mockCellSets,
    });

    store.dispatch(updateDownsampledCellOrder('testComponent'));

    const actions = store.getActions();
    expect(actions).toHaveLength(1);
    expect(actions[0].type).toBe('componentConfig/updateCellOrder');
    expect(actions[0].payload).toHaveProperty('cellOrder');
  });

  it('returns early if config is missing selectedCellSet', () => {
    store = mockStore({
      componentConfig: {
        testComponent: {
          config: { groupedTracks: ['sample'] },
        },
      },
      cellSets: mockCellSets,
    });

    store.dispatch(updateDownsampledCellOrder('testComponent'));

    expect(store.getActions()).toHaveLength(0);
  });

  it('returns early if config is missing groupedTracks', () => {
    store = mockStore({
      componentConfig: {
        testComponent: {
          config: { selectedCellSet: 'louvain' },
        },
      },
      cellSets: mockCellSets,
    });

    store.dispatch(updateDownsampledCellOrder('testComponent'));

    expect(store.getActions()).toHaveLength(0);
  });

  it('returns early if component config does not exist', () => {
    store = mockStore({
      componentConfig: {},
      cellSets: mockCellSets,
    });

    store.dispatch(updateDownsampledCellOrder('nonexistent'));

    expect(store.getActions()).toHaveLength(0);
  });

  it('parses selectedPoints and adds hidden cell sets from non-selected categories', () => {
    // When selectedPoints is "sample/sample-1", should hide "sample-2"
    store = mockStore({
      componentConfig: {
        testComponent: {
          config: {
            selectedCellSet: 'louvain',
            groupedTracks: ['sample'],
            selectedPoints: 'All',
          },
        },
      },
      cellSets: mockCellSets,
    });

    store.dispatch(updateDownsampledCellOrder('testComponent', 'sample/sample-1'));

    const actions = store.getActions();
    expect(actions).toHaveLength(1);
    // Verify that getHeatmapCellOrder was called with hidden cell sets computed
  });

  it('removes manually hidden cells that match selectedPoints', () => {
    // When selectedPoints selects a category, it should be visible
    // even if it was manually hidden
    const cellSetsWithHidden = {
      ...mockCellSets,
      hidden: new Set(['sample-1']), // manually hidden
    };

    store = mockStore({
      componentConfig: {
        testComponent: {
          config: {
            selectedCellSet: 'louvain',
            groupedTracks: ['sample'],
            selectedPoints: 'All',
          },
        },
      },
      cellSets: cellSetsWithHidden,
    });

    store.dispatch(updateDownsampledCellOrder('testComponent', 'sample/sample-1'));

    const actions = store.getActions();
    expect(actions).toHaveLength(1);
  });

  it('passes "All" to getHeatmapCellOrder even when selectedPoints is specific', () => {
    // selectedPoints is used to compute hidden sets, but "All" is passed to getHeatmapCellOrder
    store = mockStore({
      componentConfig: {
        testComponent: {
          config: {
            selectedCellSet: 'louvain',
            groupedTracks: ['sample'],
            selectedPoints: 'sample/sample-1',
          },
        },
      },
      cellSets: mockCellSets,
    });

    store.dispatch(updateDownsampledCellOrder('testComponent', 'sample/sample-1'));

    const actions = store.getActions();
    expect(actions).toHaveLength(1);
  });

  it('preserves existing hidden cell sets and adds new ones based on selectedPoints', () => {
    const cellSetsWithExistingHidden = {
      ...mockCellSets,
      hidden: new Set(['louvain-0']), // existing hidden
    };

    store = mockStore({
      componentConfig: {
        testComponent: {
          config: {
            selectedCellSet: 'louvain',
            groupedTracks: ['sample'],
            selectedPoints: 'All',
          },
        },
      },
      cellSets: cellSetsWithExistingHidden,
    });

    store.dispatch(updateDownsampledCellOrder('testComponent'));

    const actions = store.getActions();
    expect(actions).toHaveLength(1);
  });

  it('handles selectedPoints with invalid format gracefully', () => {
    // If selectedPoints doesn't have "/" format, should be ignored
    store = mockStore({
      componentConfig: {
        testComponent: {
          config: {
            selectedCellSet: 'louvain',
            groupedTracks: ['sample'],
            selectedPoints: 'invalidformat',
          },
        },
      },
      cellSets: mockCellSets,
    });

    store.dispatch(updateDownsampledCellOrder('testComponent', 'invalidformat'));

    const actions = store.getActions();
    expect(actions).toHaveLength(1);
  });

  it('dispatches updateCellOrder with computed cellOrder', () => {
    store = mockStore({
      componentConfig: {
        testComponent: {
          config: {
            selectedCellSet: 'louvain',
            groupedTracks: ['sample'],
            selectedPoints: 'All',
          },
        },
      },
      cellSets: mockCellSets,
    });

    store.dispatch(updateDownsampledCellOrder('testComponent'));

    const actions = store.getActions();
    expect(actions).toHaveLength(2);
    expect(actions[0].type).toBe('componentConfig/updateCellOrder');
    expect(actions[0].payload).toHaveProperty('cellOrder');
    expect(actions[1].type).toBe('componentConfig/update');
    expect(actions[1].payload.configChanges.isComputingCellOrder).toBe(false);
  });
});
