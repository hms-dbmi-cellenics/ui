const composeDotPlotWorkBody = (config) => ({
  name: 'DotPlot',
  markerGenes: !config.useCustomGenes,
  input: {
    nGenes: config.nMarkerGenes,
    genes: config.selectedGenes,
  },
  subset: {
    cellClassKey: config.selectedCellSet,
    cellSetKey: config.selectedPoints,
  },
});

const generatePlotWorkBody = (plotType, config) => {
  switch (plotType) {
    case 'dotPlot':
      return composeDotPlotWorkBody(config);
    default: {
      throw new Error('Plot type doesn\'t exist');
    }
  }
};

export default generatePlotWorkBody;
