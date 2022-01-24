import { enableMapSet } from 'immer';
import cellSetsReducer from 'redux/reducers/cellSets';
import initialState from 'redux/reducers/cellSets/initialState';

import {
  CELL_SETS_LOADING, CELL_SETS_LOADED,
  CELL_SETS_CREATE,
  CELL_SETS_UPDATE_PROPERTY, CELL_SETS_SET_SELECTED,
  CELL_SETS_DELETE,
  CELL_SETS_ERROR,
  CELL_SETS_HIDE, CELL_SETS_UNHIDE_ALL, CELL_SETS_UNHIDE, CELL_SETS_REORDER,
} from 'redux/actionTypes/cellSets';

enableMapSet();

describe('cellSetsReducer', () => {
  it('Reduces identical state on unknown action', () => expect(
    cellSetsReducer(undefined, {
      action: 'well/this/is/not/a/valid/action',
      payload: {},
    }),
  ).toEqual(initialState));

  it('Sets loading state on loading action', () => {
    const newState = cellSetsReducer({ ...initialState, loading: false }, {
      type: CELL_SETS_LOADING,
    });

    expect(newState.loading).toEqual(true);
  });

  it('Sets up store properly for loaded cell sets.', () => {
    const data = [
      {
        key: '1',
        name: 'parent 1',
        rootNode: true,
        children: [
          {
            key: '1a',
            name: 'first child',
            color: '#00FF00',
          },
        ],
      },
      {
        key: '2',
        name: 'parent 2',
        rootNode: true,
        children: [],
      },
    ];

    const newState = cellSetsReducer(initialState, {
      type: CELL_SETS_LOADED,
      payload: {
        data,
      },
    });

    expect(newState.loading).toEqual(false);
    expect(newState.hierarchy).toEqual([{ key: '1', children: [{ key: '1a' }] }, { key: '2', children: [] }]);
    expect(newState.properties).toMatchSnapshot();
  });

  it('Adds cells to scratchpad on creation', () => {
    const data = {
      key: 'key2',
      name: 'My Key',
      color: '#ff00ff',
      cellIds: [1, 2, 3],
      type: 'cellSets',
    };

    const newState = cellSetsReducer({ ...initialState, hierarchy: [{ key: 'scratchpad', children: [] }] }, {
      type: CELL_SETS_CREATE,
      payload: data,
    });

    expect(newState.hierarchy).toMatchSnapshot();
    expect(newState.properties).toMatchSnapshot();
  });

  it('Updates cell set properties', () => {
    const state = {
      ...initialState,
      properties: {
        1: {
          name: 'parent 1',
          color: undefined,
          cellIds: undefined,
          rootNode: true,
        },
        2: {
          name: 'parent 2',
          color: undefined,
          cellIds: undefined,
          rootNode: true,
        },
        '1a': {
          name: 'first child',
          color: '#00FF00',
          cellIds: undefined,
          rootNode: undefined,
        },
      },
      hierarchy: [{ key: '1', children: [{ key: '1a' }] }, { key: '2', children: [] }],
    };

    const newState = cellSetsReducer(state, {
      type: CELL_SETS_UPDATE_PROPERTY,
      payload: {
        cellSetKey: '1a',
        dataUpdated: { name: 'favorite child', color: '#ffffff' },
      },
    });

    expect(newState.properties['1a']).toMatchSnapshot();
  });

  it('Selected cells are maintained', () => {
    let newState = cellSetsReducer(initialState, {
      type: CELL_SETS_SET_SELECTED,
      payload: {
        keys: ['a', 'b', 'c'],
        tab: 'fakeTab',
      },
    });

    expect(newState.selected).toMatchSnapshot();

    newState = cellSetsReducer(initialState, {
      type: CELL_SETS_SET_SELECTED,
      payload: {
        keys: [1, 2, 'c', 3],
        tab: 'fakeTab',
      },
    });

    expect(newState.selected).toMatchSnapshot();
  });

  it('Removes child correctly', () => {
    const state = {
      ...initialState,
      properties: {
        1: {
          name: 'parent 1',
          color: undefined,
          cellIds: undefined,
          rootNode: true,
        },
        2: {
          name: 'parent 2',
          color: undefined,
          cellIds: undefined,
          rootNode: true,
        },
        '1a': {
          name: 'first child',
          color: '#00FF00',
          cellIds: undefined,
          rootNode: false,
          parentNodeKey: '1',
        },
      },
      hierarchy: [{ key: '1', children: [{ key: '1a' }] }, { key: '2', children: [] }],
    };

    const newState = cellSetsReducer(state, {
      type: CELL_SETS_DELETE,
      payload: {
        key: '1a',
      },
    });

    expect(Object.keys(newState.properties).length).toEqual(2);
    expect(newState.hierarchy.length).toEqual(2);
    expect(newState.hierarchy).toMatchSnapshot();
  });

  it('Sets error conditions', () => {
    const newState = cellSetsReducer(initialState, {
      type: CELL_SETS_ERROR,
      payload: {
        error: 'asdsadsa',
      },
    });

    expect(newState.error).toEqual('asdsadsa');
  });

  it('Adds hidden cell sets to set', () => {
    const newState = cellSetsReducer(initialState, {
      type: CELL_SETS_HIDE,
      payload: {
        key: 'new',
      },
    });

    expect(newState.hidden).toMatchSnapshot();
  });

  it('Handles rehiding of previously hidden cell sets', () => {
    const previousState = {
      ...initialState,
      hidden: new Set('a', 'b', 'c'),
    };

    const newState = cellSetsReducer(previousState, {
      type: CELL_SETS_HIDE,
      payload: {
        key: 'a',
      },
    });

    expect(newState.hidden).toMatchSnapshot();
  });

  it('Handles unhiding of previously hidden cell sets', () => {
    const previousState = {
      ...initialState,
      hidden: new Set('a', 'b', 'c'),
    };

    const newState = cellSetsReducer(previousState, {
      type: CELL_SETS_UNHIDE,
      payload: {
        key: 'a',
      },
    });

    expect(newState.hidden).toMatchSnapshot();
  });

  it('Handles unhiding of a not hidden cell set', () => {
    const previousState = {
      ...initialState,
      hidden: new Set('a', 'b', 'c'),
    };

    const newState = cellSetsReducer(previousState, {
      type: CELL_SETS_UNHIDE,
      payload: {
        key: 'e',
      },
    });

    expect(newState.hidden).toMatchSnapshot();
  });

  it('Handles unhiding all', () => {
    const previousState = {
      ...initialState,
      hidden: new Set('a', 'b', 'c'),
    };

    const newState = cellSetsReducer(previousState, {
      type: CELL_SETS_UNHIDE_ALL,
      payload: {},
    });

    expect(newState.hidden).toEqual(initialState.hidden);
  });

  it('Handles unhiding all when no cell set is hidden', () => {
    const newState = cellSetsReducer(initialState, {
      type: CELL_SETS_UNHIDE_ALL,
      payload: {},
    });

    expect(newState.hidden).toEqual(initialState.hidden);
  });

  it('reorders correctly', () => {
    const state = {
      ...initialState,
      properties: {
        1: {
          name: 'parent 1',
          color: undefined,
          cellIds: undefined,
          rootNode: true,
        },
        2: {
          name: 'parent 2',
          color: undefined,
          cellIds: undefined,
          rootNode: true,
        },
        '1a': {
          name: 'first child',
          color: '#00FF00',
          cellIds: [],
          rootNode: false,
        },
        '1b': {
          name: 'second child',
          color: '#00FFFF',
          cellIds: [],
          rootNode: false,
        },
      },
      hierarchy: [{ key: '1', children: [{ key: '1a' }, { key: '1b' }] }, { key: '2', children: [] }],
    };

    const newState = cellSetsReducer(state, {
      type: CELL_SETS_REORDER,
      payload: {
        cellSetKey: '1a',
        newPosition: '1',
        cellClassKey: '1',
      },
    });

    expect(newState.hierarchy[0].children[1]).toEqual({ key: '1a' });

    expect(newState).toMatchSnapshot();
  });
});
