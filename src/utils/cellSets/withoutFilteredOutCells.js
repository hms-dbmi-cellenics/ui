const union = (set1, set2) => {
  const resultSet = new Set();

  set1.forEach((elem) => resultSet.add(elem));
  set2.forEach((elem) => resultSet.add(elem));

  return resultSet;
};

// Uses includes or has depending on if set2 is an Array or a Set
const contains = (container, element) => (
  Array.isArray(container) ? container.includes(element) : container.has(element)
);

const intersection = (set1, set2) => {
  const resultSet = new Set();

  set1.forEach((elem) => {
    if (contains(set2, elem)) {
      resultSet.add(elem);
    }
  });

  return resultSet;
};

const withoutFilteredOutCells = (cellSets, originalCellIds) => {
  const louvainClusters = cellSets.find(({ key }) => key === 'louvain').children;

  const filteredInCellIds = louvainClusters.reduce(
    (filteredInCellIdsAcum, { cellIds }) => union(filteredInCellIdsAcum, cellIds),
    new Set(),
  );

  return intersection(filteredInCellIds, originalCellIds);
};

export default withoutFilteredOutCells;
