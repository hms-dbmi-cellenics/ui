import { getAllCells } from 'utils/cellSets';

import {
  createHierarchyFromTree,
  createPropertiesFromTree,
} from 'redux/reducers/cellSets/helpers';

const mockCellSet = require('__test__/data/cell_sets.json');

const cellSets = {
  properties: createPropertiesFromTree(mockCellSet.cellSets),
  hierarchy: createHierarchyFromTree(mockCellSet.cellSets),
};

const sampleCellClass = mockCellSet.cellSets.find(({ key }) => key === 'sample');
const louvainCellClass = mockCellSet.cellSets.find(({ key }) => key === 'louvain');

const louvainNumCells = louvainCellClass.children.reduce(
  (sum, cellSet) => sum + cellSet.cellIds.length,
  0,
);

const numCells = sampleCellClass.children.reduce(
  (sum, cellSet) => sum + cellSet.cellIds.length,
  0,
);

describe('Get all cells', () => {
  it('Returns all ids for a cell set', () => {
    const allCellIds = getAllCells(cellSets);
    expect(allCellIds.length).toEqual(numCells);

    expect(allCellIds[0]).toMatchInlineSnapshot(`
      Object {
        "cellId": 1,
        "cellSetKey": "b62028a1-ffa0-4f10-823d-93c9ddb88898",
      }
    `);
  });

  it('Passing group by inserts the key of the group to the result', () => {
    const allCellIds = getAllCells(cellSets, 'louvain');
    expect(allCellIds.length).toEqual(louvainNumCells);

    expect(allCellIds[0]).toMatchInlineSnapshot(`
      Object {
        "cellId": 1,
        "cellSetKey": "louvain-0",
      }
    `);
  });

  it('Returns empty array if cellSets is empty', () => {
    const emptyCellSets = {
      properties: {},
      hierarchy: [],
    };

    const allCellIds = getAllCells(emptyCellSets);
    expect(allCellIds.length).toEqual(0);
  });
});
