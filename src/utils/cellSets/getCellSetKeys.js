// Cell sets have the name [cellSetClass/]cellSetKey
// These are functions to get the keys of the cellSetClass or the cellSet
const getCellSetKey = (name) => (Array.isArray(name) ? name : name?.split('/')[1] || name);
const getCellSetClassKey = (name) => name?.split('/')[0];

export {
  getCellSetKey,
  getCellSetClassKey,
};
