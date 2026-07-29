import checkCanRunDiffExpr, { canRunDiffExprResults } from 'utils/extraActionCreators/differentialExpression/checkCanRunDiffExpr';

const enoughCellIds = (start) => new Set(
  Array.from({ length: 20 }, (unused, idx) => start + idx),
);

const getCellSets = () => ({
  hierarchy: [
    { key: 'louvain', children: [{ key: 'louvain-0' }] },
    { key: 'sample', children: [{ key: 'sample-a' }, { key: 'sample-b' }] },
  ],
  properties: {
    louvain: { name: 'Louvain clusters', type: 'cellSets', cellIds: new Set() },
    'louvain-0': { name: 'Cluster 0', cellIds: new Set([...enoughCellIds(0), ...enoughCellIds(100)]) },
    sample: { name: 'Samples', type: 'metadataCategorical', cellIds: new Set() },
    'sample-a': { name: 'sample a', cellIds: enoughCellIds(0) },
    'sample-b': { name: 'sample b', cellIds: enoughCellIds(100) },
  },
});

const check = (cellSets, comparisonGroup) => checkCanRunDiffExpr(
  cellSets.properties,
  cellSets.hierarchy,
  { between: comparisonGroup },
  'between',
);

describe('checkCanRunDiffExpr', () => {
  it('Allows a comparison with enough cells in each sample', () => {
    expect(check(getCellSets(), {
      basis: 'louvain/louvain-0',
      cellSet: 'sample/sample-a',
      compareWith: 'sample/sample-b',
    })).toEqual(canRunDiffExprResults.INSUFFICIENT_CELLS_WARNING);
  });

  it('Allows a comparison of a cell set whose key contains a slash', () => {
    const cellSets = getCellSets();
    const keyWithSlash = 'louvain-Oligodendrocyte (mature/myelinating)';

    cellSets.hierarchy[0].children = [{ key: keyWithSlash }];
    cellSets.properties[keyWithSlash] = cellSets.properties['louvain-0'];
    delete cellSets.properties['louvain-0'];

    expect(check(cellSets, {
      basis: `louvain/${keyWithSlash}`,
      cellSet: 'sample/sample-a',
      compareWith: 'sample/sample-b',
    })).toEqual(canRunDiffExprResults.INSUFFICIENT_CELLS_WARNING);
  });

  it('Does not allow a comparison if a selected cell set no longer exists', () => {
    // Cell sets are replaced when they are reloaded (e.g. after a reprocess or a
    // re-upload), which can leave selections pointing at cell sets that are gone.
    const cellSets = getCellSets();
    delete cellSets.properties['louvain-0'];
    cellSets.hierarchy[0].children = [];

    expect(check(cellSets, {
      basis: 'louvain/louvain-0',
      cellSet: 'sample/sample-a',
      compareWith: 'sample/sample-b',
    })).toEqual(canRunDiffExprResults.FALSE);

    expect(check(cellSets, {
      basis: 'all',
      cellSet: 'louvain/louvain-0',
      compareWith: 'sample/sample-b',
    })).toEqual(canRunDiffExprResults.FALSE);

    expect(check(cellSets, {
      basis: 'all',
      cellSet: 'sample/sample-a',
      compareWith: 'louvain/louvain-0',
    })).toEqual(canRunDiffExprResults.FALSE);
  });

  it('Does not allow a comparison if the cell sets are not loaded', () => {
    expect(check({ properties: {}, hierarchy: [] }, {
      basis: 'louvain/louvain-0',
      cellSet: 'sample/sample-a',
      compareWith: 'sample/sample-b',
    })).toEqual(canRunDiffExprResults.FALSE);
  });

  it('Does not reuse the cell id to sample mapping of previously loaded cell sets', () => {
    const comparisonGroup = {
      basis: 'louvain/louvain-0',
      cellSet: 'sample/sample-a',
      compareWith: 'sample/sample-b',
    };

    expect(check(getCellSets(), comparisonGroup))
      .toEqual(canRunDiffExprResults.INSUFFICIENT_CELLS_WARNING);

    // Same cell sets, same number of samples, but all the cells are now in the
    // second sample, so the first one no longer has enough cells
    const reloadedCellSets = getCellSets();
    reloadedCellSets.properties['sample-a'] = { name: 'sample a', cellIds: new Set() };
    reloadedCellSets.properties['sample-b'] = {
      name: 'sample b',
      cellIds: new Set([...enoughCellIds(0), ...enoughCellIds(100)]),
    };

    expect(check(reloadedCellSets, comparisonGroup))
      .toEqual(canRunDiffExprResults.INSUFFCIENT_CELLS_ERROR);
  });
});
