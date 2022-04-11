import getNumberOfCellsInGrouping from 'redux/selectors/getNumberOfCellsInGrouping';

describe('getNumberOfCellsInGrouping', () => {
  const stateMock = {
    cellSets: {
      hierarchy: [{ key: 'sample' }, { key: 'louvain', children: [{ key: 'louvain-0' }, { key: 'louvain-1' }, { key: 'louvain-2' }] }],
      properties: {
        'louvain-0': { cellIds: new Set([1, 2]) },
        'louvain-1': { cellIds: new Set([3, 4]) },
        'louvain-2': { cellIds: new Set([5, 6]) },
      },
    },
  };

  it('works correctly', () => {
    expect(getNumberOfCellsInGrouping('louvain', stateMock)).toEqual(6);
  });
});
