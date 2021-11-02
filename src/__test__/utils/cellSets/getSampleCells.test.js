import { getSampleCells } from 'utils/cellSets';

import {
  createHierarchyFromTree,
  createPropertiesFromTree,
} from 'redux/reducers/cellSets/helpers';

const mockCellSet = require('__test__/data/cell_sets.json');

const cellSets = {
  properties: createPropertiesFromTree(mockCellSet.cellSets),
  hierarchy: createHierarchyFromTree(mockCellSet.cellSets),
};

const sampleKey = 'louvain-0';
const numCells = cellSets.properties[sampleKey].cellIds.size;

describe('Get sample cells', () => {
  it('Returns all ids of all cells', () => {
    const allCellIds = getSampleCells(cellSets, 'louvain-0');
    expect(allCellIds.length).toEqual(numCells);

    expect(allCellIds[0]).toMatchInlineSnapshot(`
      Object {
        "cellId": 1,
        "cellSetKey": "louvain-0",
      }
    `);
  });

  it('Throws an error if cellSets does not exist', () => {
    const emptyCellSets = {
      properties: {},
      hierarchy: [],
    };

    expect(() => { getSampleCells(emptyCellSets, 'louvain-0'); }).toThrow();
  });
});
