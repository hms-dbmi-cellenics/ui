const upperCaseArray = (array) => (array.map((element) => element.toUpperCase()));

const findLoadedGenes = (matrix, selectedGenes) => {
  // Check which of the genes we actually need to load. Only do this if
  // we are not forced to reload all of the data.
  const storedGenes = matrix.getStoredGenes();

  const genesToLoad = [...selectedGenes].filter(
    (gene) => !new Set(upperCaseArray(storedGenes)).has(gene.toUpperCase()),
  );

  const genesAlreadyLoaded = matrix.getStoredGenes().filter(
    (gene) => upperCaseArray(selectedGenes).includes(gene.toUpperCase()),
  );

  return { genesToLoad, genesAlreadyLoaded };
};

export { upperCaseArray, findLoadedGenes };
