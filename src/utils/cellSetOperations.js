const unionByCellClass = (cellClassKey, hierarchy, properties) => {
  const cellSetKeys = hierarchy
    .find(({ key }) => key === cellClassKey).children
    .map(({ key }) => key);

  return union(cellSetKeys, properties);
};

const union = (listOfSets, properties) => {
  if (!listOfSets) {
    return new Set();
  }
  const sets = listOfSets.map((key) => properties[key]?.cellIds || []);
  const unionSet = new Set(
    [].concat(
      ...sets.map(
        (set) => [...set],
      ),
    ),
  );

  return unionSet;
};

const intersection = (listOfSets, properties) => {
  if (!listOfSets) {
    return new Set();
  }

  const sets = listOfSets.map(
    (key) => properties[key]?.cellIds || null,
  ).filter(
    (set) => set && set.size > 0,
  );

  if (sets.length === 0) {
    return new Set();
  }

  const intersectionSet = sets.reduce(
    (acc, curr) => new Set([...acc].filter((x) => curr.has(x))),
  );

  return intersectionSet;
};

const complement = (listOfSets, properties) => {
  if (!listOfSets) {
    return new Set();
  }

  // get the ids of all selected cells
  const selectedCells = listOfSets.map(
    (key) => properties[key]?.cellIds || null,
  ).filter(
    (set) => set && set.size > 0,
  ).reduce(
    (acc, curr) => new Set([...acc, ...curr]),
  );

  // get the ids of all cells in the dataset
  // All cells are assumed to be included in at least 1 cluster
  const complementSet = Object.values(properties).map(
    (cluster) => cluster.cellIds,
  ).filter(
    (set) => set && set.size > 0,
  ).reduce(
    (acc, curr) => new Set([...acc, ...curr]),
  );

  // remove all cells that are selected
  if (selectedCells.size > 0) {
    selectedCells.forEach((x) => { complementSet.delete(x); });
  }

  // return the rest of the cells that are in the dataset and were not selected
  return complementSet;
};

export {
  union,
  intersection,
  complement,
  unionByCellClass,
};
