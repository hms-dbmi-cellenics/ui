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

export { union, intersection };
