// Cell sets have the name [cellSetClass/]cellSetKey
// These are functions to get the keys of the cellSetClass or the cellSet
// Only the first slash separates the two: a cellSetKey can itself contain
// slashes, since keys can be derived from user facing names
// (e.g. `louvain/louvain-Oligodendrocyte (mature/myelinating)`).
const getCellSetKey = (name) => {
  if (Array.isArray(name) || !name) return name;

  const separatorIdx = name.indexOf('/');

  return separatorIdx === -1 ? name : name.slice(separatorIdx + 1);
};

const getCellSetClassKey = (name) => name?.split('/')[0];

export {
  getCellSetKey,
  getCellSetClassKey,
};
