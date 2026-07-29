import { getCellSetKey, getCellSetClassKey } from 'utils/cellSets/getCellSetKeys';

describe('getCellSetKey', () => {
  it('Returns the cell set key of a [cellSetClass/]cellSetKey name', () => {
    expect(getCellSetKey('louvain/louvain-0')).toEqual('louvain-0');
  });

  it('Returns the whole name if there is no cell set class', () => {
    expect(getCellSetKey('all')).toEqual('all');
  });

  it('Keeps the slashes that are part of the cell set key', () => {
    // Cell set keys can be derived from user facing names, which can contain slashes
    expect(getCellSetKey('louvain/louvain-Oligodendrocyte (mature/myelinating)'))
      .toEqual('louvain-Oligodendrocyte (mature/myelinating)');
  });

  it('Passes arrays and empty values through', () => {
    expect(getCellSetKey(['louvain-0'])).toEqual(['louvain-0']);
    expect(getCellSetKey(null)).toEqual(null);
    expect(getCellSetKey(undefined)).toEqual(undefined);
  });
});

describe('getCellSetClassKey', () => {
  it('Returns the cell set class key', () => {
    expect(getCellSetClassKey('louvain/louvain-0')).toEqual('louvain');
    expect(getCellSetClassKey('louvain/louvain-Oligodendrocyte (mature/myelinating)'))
      .toEqual('louvain');
  });

  it('Returns the whole name if there is no cell set class', () => {
    expect(getCellSetClassKey('all')).toEqual('all');
  });
});
