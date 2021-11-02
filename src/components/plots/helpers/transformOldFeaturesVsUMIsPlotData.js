const transformOldFeaturesVsUMIsPlotData = (plotData) => {
  // is an array and not empty (aka its old plotData)

  // removing upper/lower cutoff as not used
  const pointsData = plotData.map(
    (p) => ({ log_molecules: p.log_molecules, log_genes: p.log_genes }),
  );

  // mock up linesData by grabbing first and last points
  const logMolecules = plotData.map((p) => p.log_molecules);

  const lastIndex = plotData.length - 1;
  const linesData = [
    {
      lower_cutoff: plotData[0].lower_cutoff,
      upper_cutoff: plotData[0].upper_cutoff,
      log_molecules: Math.min(...logMolecules),
    },
    {
      lower_cutoff: plotData[lastIndex].lower_cutoff,
      upper_cutoff: plotData[lastIndex].upper_cutoff,
      log_molecules: Math.max(...logMolecules),
    },
  ];

  return { pointsData, linesData };
};

export default transformOldFeaturesVsUMIsPlotData;
