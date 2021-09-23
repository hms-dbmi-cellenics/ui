const migrateFeaturesVsUMIsPlotData = (plotData) => {
  if (!Array.isArray(plotData) || !plotData.length) return plotData;

  // is an array and not empty (aka its old plotData)
  const pointsData = plotData;

  // mock up linesData by grabbing first and last points
  const logMolecules = plotData.map((p) => p.log_molecules);

  const lastIndex = pointsData.length - 1;
  const linesData = [
    {
      lower_cutoff: pointsData[0].lower_cutoff,
      upper_cutoff: pointsData[0].upper_cutoff,
      log_molecules: Math.min(...logMolecules),
    },
    {
      lower_cutoff: pointsData[lastIndex].lower_cutoff,
      upper_cutoff: pointsData[lastIndex].upper_cutoff,
      log_molecules: Math.max(...logMolecules),
    },
  ];

  return { pointsData, linesData };
};

export default migrateFeaturesVsUMIsPlotData;
