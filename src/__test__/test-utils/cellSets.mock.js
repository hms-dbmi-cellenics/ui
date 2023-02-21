const mockCellSetsHierarchy = [
  {
    key: 'louvain',
    children: [{ key: 'cluster-a' }, { key: 'cluster-b' }, { key: 'cluster-c' }],
    cellIds: new Set(),
  },
  {
    key: 'sample',
    children: [{ key: 'sample-1' }, { key: 'sample-2' }],
    cellIds: new Set(),
  },
  {
    key: 'scratchpad',
    children: [{ key: 'scratchpad-a' }],
    cellIds: new Set(),
  },
];

const mockCellSets = {
  initialLoadPending: false,
  error: false,
  loading: false,
  hierarchy: mockCellSetsHierarchy,
  accessible: true,
  properties: {
    'cluster-a': {
      name: 'cluster a',
      key: 'cluster-a',
      cellIds: new Set([0, 1, 6]),
      color: '#01FFFF',
    },
    'cluster-b': {
      name: 'cluster b',
      key: 'cluster-b',
      cellIds: new Set([2, 3]),
      color: '#23FFFF',
    },
    'cluster-c': {
      name: 'cluster c',
      key: 'cluster-c',
      cellIds: new Set([4, 5]),
      color: '#45FFFF',
    },
    'sample-1': {
      name: 'Sample 1',
      key: 'sample-1',
      cellIds: new Set([0, 1, 2]),
      color: '#012FFF',
    },
    'sample-2': {
      name: 'Sample 2',
      key: 'sample-2',
      cellIds: new Set([3, 4, 5]),
      color: '#345FFF',
    },
    'scratchpad-a': {
      cellIds: new Set(['5']),
      key: 'scratchpad-a',
      name: 'New Cluster',
      color: '#5FFFFF',
    },
    louvain: {
      cellIds: new Set(),
      name: 'Louvain clusters',
      key: 'louvain',
      type: 'cellSets',
      rootNode: true,
    },
    sample: {
      cellIds: new Set([6, 7, 8]),
      name: 'Samples',
      key: 'sample',
      type: 'metadataCategorical',
      rootNode: true,
    },
    scratchpad: {
      cellIds: new Set(),
      name: 'Scratchpad',
      key: 'scratchpad',
      type: 'cellSets',
      rootNode: true,
    },
  },
};

export {
  // eslint-disable-next-line import/prefer-default-export
  mockCellSets,
  mockCellSetsHierarchy,
};
