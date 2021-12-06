import _ from 'lodash';

import { filterCells } from 'utils/plotSpecs/generateEmbeddingCategoricalSpec';

import {
  createHierarchyFromTree,
  createPropertiesFromTree,
} from 'redux/reducers/cellSets/helpers';

const { cellSets: mockCellSets } = require('__test__/data/cell_sets.json');

describe('generateEmbeddingCategoricalSpec', () => {
  let mockCellSetsReduxObject;

  beforeEach(() => {
    mockCellSetsReduxObject = {
      properties: createPropertiesFromTree(mockCellSets),
      hierarchy: createHierarchyFromTree(mockCellSets),
    };
  });

  it('filterCells generates correct data with all louvain clusters', () => {
    const result = filterCells(mockCellSetsReduxObject, 'All', 'louvain');

    const expectedCellSetKeys = mockCellSets
      .find(({ key }) => key === 'louvain').children
      .map(({ key, name, color }) => ({ key, name, color }));

    // Contains all the louvain cellSets (and in the correct order)
    expect(result.cellSetLegendsData).toEqual(expectedCellSetKeys);

    // CellIds are filtered fine
    expect(result).toMatchSnapshot();
  });

  it('filterCells generates correct louvain clusters data with one sample in particular', () => {
    const result = filterCells(mockCellSetsReduxObject, '98c7a0ed-d086-4df8-bf94-a9ee6edb793f', 'louvain');

    const louvainClustersWithinSample = ['louvain-0', 'louvain-1', 'louvain-2'];

    const expectedCellSetKeys = mockCellSets
      .find(({ key }) => key === 'louvain').children
      .filter(({ key }) => louvainClustersWithinSample.includes(key))
      .map(({ key, name, color }) => ({ key, name, color }));

    // Contains the 3 expected louvain cellSets
    expect(result.cellSetLegendsData).toEqual(expectedCellSetKeys);

    // CellIds are filtered fine
    expect(result).toMatchSnapshot();
  });

  it('filterCells generates correct samples data with one sample in particular', () => {
    const sampleKey = 'b62028a1-ffa0-4f10-823d-93c9ddb88898';

    const result = filterCells(mockCellSetsReduxObject, sampleKey, 'sample');

    // Contains one single legend
    expect(result.cellSetLegendsData).toEqual([{
      color: '#8c564b',
      key: sampleKey,
      name: 'KO',
    },
    ]);

    // CellIds are filtered fine
    expect(result).toMatchSnapshot();
  });

  it('works correctly with some repeated names in louvain clusters', () => {
    const mockCellSetsWithRepeatedClusterNames = _.cloneDeep(mockCellSets);

    const louvainCellSets = mockCellSetsWithRepeatedClusterNames.find(({ key }) => key === 'louvain').children;

    louvainCellSets[0].name = 'repeatedName';
    louvainCellSets[2].name = 'repeatedName';
    louvainCellSets[6].name = 'repeatedName';

    mockCellSetsReduxObject = {
      properties: createPropertiesFromTree(mockCellSetsWithRepeatedClusterNames),
      hierarchy: createHierarchyFromTree(mockCellSetsWithRepeatedClusterNames),
    };

    const result = filterCells(mockCellSetsReduxObject, 'All', 'louvain');

    const expectedCellSetKeys = mockCellSetsWithRepeatedClusterNames
      .find(({ key }) => key === 'louvain').children
      .map(({ key, name, color }) => ({ key, name, color }));

    // Contains all the louvain cellSets (and in the correct order)
    expect(result.cellSetLegendsData).toEqual(expectedCellSetKeys);

    // CellIds are filtered fine
    expect(result).toMatchSnapshot();
  });
});
