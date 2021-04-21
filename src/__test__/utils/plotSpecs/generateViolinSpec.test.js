import _ from 'lodash';

import { generateData } from '../../../utils/plotSpecs/generateViolinSpec';

const cellSets = {
  hierarchy: [
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
  ],
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
      cellIds: new Set(),
      name: 'Samples',
      key: 'sample',
      type: 'cellSets',
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

describe('generateData', () => {
  const MOCK_RANDOM = 0.1;
  const mockGeneExpression = [0, 1, 2, 3, 4, 5, null];
  beforeEach(() => {
    jest.spyOn(global.Math, 'random').mockReturnValue(MOCK_RANDOM);
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('generates data when grouping by lovain clusters', () => {
    const groupingId = 'louvain';
    const plotData = generateData(cellSets, mockGeneExpression, groupingId, 'All');

    expect(_.keys(plotData.groups).sort()).toEqual(['cluster-a', 'cluster-b', 'cluster-c']);
    expect(plotData.groups['cluster-a']).toEqual({ name: 'cluster a', color: '#01FFFF' });

    const expectedCells = [
      { group: 'cluster-a', y: 0, x: MOCK_RANDOM },
      { group: 'cluster-a', y: 1, x: MOCK_RANDOM },
      { group: 'cluster-b', y: 2, x: MOCK_RANDOM },
      { group: 'cluster-b', y: 3, x: MOCK_RANDOM },
      { group: 'cluster-c', y: 4, x: MOCK_RANDOM },
      { group: 'cluster-c', y: 5, x: MOCK_RANDOM },
    ];
    expect(plotData.cells).toEqual(expectedCells);
  });

  it('generates data when grouping by sample', () => {
    const groupingId = 'sample';
    const plotData = generateData(cellSets, mockGeneExpression, groupingId, 'All');

    expect(_.keys(plotData.groups).sort()).toEqual(['sample-1', 'sample-2']);
    expect(plotData.groups['sample-1']).toEqual({ name: 'Sample 1', color: '#012FFF' });

    const expectedCells = [
      { group: 'sample-1', y: 0, x: MOCK_RANDOM },
      { group: 'sample-1', y: 1, x: MOCK_RANDOM },
      { group: 'sample-1', y: 2, x: MOCK_RANDOM },
      { group: 'sample-2', y: 3, x: MOCK_RANDOM },
      { group: 'sample-2', y: 4, x: MOCK_RANDOM },
      { group: 'sample-2', y: 5, x: MOCK_RANDOM },
    ];
    expect(plotData.cells).toEqual(expectedCells);
  });

  it('generates data when grouping by scratchpad', () => {
    const groupingId = 'scratchpad';
    const plotData = generateData(cellSets, mockGeneExpression, groupingId, 'All');

    expect(_.keys(plotData.groups).sort()).toEqual(['scratchpad-a']);
    expect(plotData.groups['scratchpad-a']).toEqual({ name: 'New Cluster', color: '#5FFFFF' });

    const expectedCells = [
      { group: 'scratchpad-a', y: 5, x: MOCK_RANDOM },
    ];
    expect(plotData.cells).toEqual(expectedCells);
  });

  it('generates the x value for only the cells in the specified group', () => {
    const groupingId = 'louvain';
    const plotData = generateData(cellSets, mockGeneExpression, groupingId, 'sample/sample-1');
    const expectedCells = [
      { group: 'cluster-a', y: 0, x: MOCK_RANDOM },
      { group: 'cluster-a', y: 1, x: MOCK_RANDOM },
      { group: 'cluster-b', y: 2, x: MOCK_RANDOM },
      { group: 'cluster-b', y: 3 },
      { group: 'cluster-c', y: 4 },
      { group: 'cluster-c', y: 5 },
    ];
    expect(plotData.cells).toEqual(expectedCells);
  });

  it('generates the no x value when null is specified', () => {
    const groupingId = 'louvain';
    const plotData = generateData(cellSets, mockGeneExpression, groupingId, null);
    expect(plotData.cells.filter((cell) => cell.x).length).toEqual(0);
  });
});
