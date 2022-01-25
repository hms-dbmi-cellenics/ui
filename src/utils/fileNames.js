const frequencyPlotCsvName = (experimentName, frequencyType) => (
  `${experimentName.replace(/ /g, '_')}-freq-plot-${frequencyType}`
);

export { frequencyPlotCsvName };
