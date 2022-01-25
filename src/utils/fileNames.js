const frequencyPlotCsvName = (experimentName, frequencyType) => (
  `${experimentName.replace(/ /g, '_')}-freq-plot-${frequencyType}`
);

// eslint-disable-next-line import/prefer-default-export
export { frequencyPlotCsvName };
