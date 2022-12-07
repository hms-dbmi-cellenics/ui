const getHighestDispersionGenes = (geneData, number) => {
  const dispersions = Object.values(geneData).map((gene) => gene.dispersions);
  dispersions.sort((a, b) => b - a);
  const highestDispersions = dispersions.slice(0, number);

  const getKeyByValue = (value) => Object.keys(geneData)
    .find((key) => geneData[key].dispersions === value);

  const highestDispersionGenes = highestDispersions.map((value) => getKeyByValue(value));

  return highestDispersionGenes;
};

export default getHighestDispersionGenes;
