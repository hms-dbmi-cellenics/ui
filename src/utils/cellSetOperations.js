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

  const intersectionSet = sets.reduce(
    (acc, curr) => new Set([...acc].filter((x) => curr.has(x))),
  );

  return intersectionSet;
};

const complement = (listOfSets, properties) => {
  if (!listOfSets) {
    return new Set();
  }

  const selectedCells = listOfSets.map(
    (key) => properties[key]?.cellIds || null,
  ).filter(
    (set) => set && set.size > 0,
  ).reduce(
    (acc, curr) => new Set([...acc, ...curr]),
  );

  // All cells are assumed to be included in at least 1 cluster
  const complementSet = Object.values(properties).map(
    (cluster) => cluster.cellIds,
  ).filter(
    (set) => set && set.size > 0,
  ).reduce(
    (acc, curr) => new Set([...acc, ...curr]),
  );

  if (selectedCells.size > 0) {
    selectedCells.forEach((x) => { complementSet.delete(x); });
  }

  return complementSet;
};

export { union, intersection, complement };
