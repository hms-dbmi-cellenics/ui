const getCellSetKey = (name) => (name?.split('/')[1] || name);
const getRootKey = (name) => name?.split('/')[0];

export {
  getCellSetKey,
  getRootKey,
};
