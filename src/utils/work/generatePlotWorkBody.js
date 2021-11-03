import plotNames from 'utils/plots/plotNames';

const composeDotPlotWorkBody = (config) => ({
  name: plotNames.DOT_PLOT,
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
    case plotNames.DOT_PLOT:
      return composeDotPlotWorkBody(config);
    default: {
      throw new Error('Plot type doesn\'t exist');
    }
  }
};

export default generatePlotWorkBody;
