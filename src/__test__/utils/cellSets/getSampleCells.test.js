import {
  createHierarchyFromTree,
  createPropertiesFromTree,
} from 'redux/reducers/cellSets/helpers';

import { getSampleCells } from 'utils/cellSets';

const mockCellSet = require('__test__/data/cell_sets.json');

const cellSets = {
  properties: createPropertiesFromTree(mockCellSet.cellSets),
  hierarchy: createHierarchyFromTree(mockCellSet.cellSets),
};

const sampleKey = 'louvain-0';
const numCells = cellSets.properties[sampleKey].cellIds.size;

describe('Get sample cells', () => {
  it('returns all ids of all cells', () => {
    const allCellIds = getSampleCells(cellSets, 'louvain-0');
    expect(allCellIds.length).toEqual(numCells);

    expect(allCellIds[0]).toMatchInlineSnapshot(`
      {
        "cellId": 1,
        "cellSetKey": "louvain-0",
      }
    `);
  });

  it('does not throw an error if cellSets does not exist', () => {
    const emptyCellSets = {
      properties: {},
      hierarchy: [],
    };

    expect(() => {
      getSampleCells(emptyCellSets, 'louvain-0');
    }).not.toThrow();
    expect(getSampleCells(emptyCellSets, 'louvain-0')).toEqual([]);
  });
});
