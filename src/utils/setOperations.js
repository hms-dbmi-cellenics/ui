const difference = (filteredSet, filteringSet) => {
  const result = new Set(
    [...filteredSet].filter((x) => !filteringSet.has(x)),
  );

  return result;
};

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

export {
  difference, union, contains, intersection,
};
