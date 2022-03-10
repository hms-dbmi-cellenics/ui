import _ from 'lodash';

import { filterCells, generateData } from 'utils/plotSpecs/generateEmbeddingCategoricalSpec';

import {
  createHierarchyFromTree,
  createPropertiesFromTree,
} from 'redux/reducers/cellSets/helpers';

const { cellSets: mockCellSets } = require('__test__/data/cell_sets.json');

describe('filterCells', () => {
  let mockCellSetsReduxObject;

  beforeEach(() => {
    mockCellSetsReduxObject = {
      properties: createPropertiesFromTree(mockCellSets),
      hierarchy: createHierarchyFromTree(mockCellSets),
    };
  });

  it('generates correct louvain clusters data with one sample in particular', () => {
    const sampleKey = 'b62028a1-ffa0-4f10-823d-93c9ddb88898';
    const louvainClustersWithinSample = ['louvain-0', 'louvain-1'];

    const result = filterCells(mockCellSetsReduxObject, sampleKey, 'louvain');

    const expectedCellSetKeys = mockCellSets
      .find(({ key }) => key === 'louvain').children
      .filter(({ key }) => louvainClustersWithinSample.includes(key))
      .map(({ key, name, color }) => ({ key, name, color }));

    // Contains the 2 expected louvain cellSets
    expect(result.cellSetLegendsData).toEqual(expectedCellSetKeys);

    // CellIds are filtered fine
    expect(result).toMatchSnapshot();
  });

  it('generates correct samples data with one sample in particular', () => {
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

describe('generateData', () => {
  let mockCellSetsReduxObject;
  let mockEmbeddingData;

  beforeEach(() => {
    mockCellSetsReduxObject = {
      properties: createPropertiesFromTree(mockCellSets),
      hierarchy: createHierarchyFromTree(mockCellSets),
    };

    mockEmbeddingData = _.range(30).map(() => [1, 2]);
  });

  it('generates correct data with all louvain clusters', () => {
    const result = generateData(mockCellSetsReduxObject, 'All', 'louvain', mockEmbeddingData);

    const expectedCellSetKeys = mockCellSets
      .find(({ key }) => key === 'louvain').children
      .map(({ key, name, color }) => ({ key, name, color }));

    // Contains all the louvain cellSets (and in the correct order)
    expect(result.cellSetLegendsData).toEqual(expectedCellSetKeys);

    // CellIds are filtered fine
    expect(result).toMatchSnapshot();
  });

  it('generates correct data with 1 cluster', () => {
    const result = generateData(mockCellSetsReduxObject, 'louvain-5', 'louvain', mockEmbeddingData);

    const expectedCellSetKeys = mockCellSets
      .find(({ key }) => key === 'louvain').children
      .filter(({ key }) => key === 'louvain-5')
      .map(({ key, name, color }) => ({ key, name, color }));

    // Contains all the louvain cellSets (and in the correct order)
    expect(result.cellSetLegendsData).toEqual(expectedCellSetKeys);

    // CellIds are filtered fine
    expect(result).toMatchSnapshot();
  });
});
