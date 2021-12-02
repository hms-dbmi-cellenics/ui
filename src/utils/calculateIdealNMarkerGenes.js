const calculateIdealNMarkerGenes = (louvainClusterCount) => {
  if (!louvainClusterCount) return 5;

  const adjustedToDatasetNGenes = Math.max(5 - Math.floor(louvainClusterCount / 30), 2);
  return adjustedToDatasetNGenes;
};

export default calculateIdealNMarkerGenes;
