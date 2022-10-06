class SetOperations {
  static difference(filteredSet, filteringSet) {
    const result = new Set(
      [...filteredSet].filter((x) => !filteringSet.has(x)),
    );

    return result;
  }
}

export default SetOperations;
