import { plotTypes } from 'utils/constants';

const composeDotPlotWorkBody = (config) => ({
  name: plotTypes.DOT_PLOT,
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
    case plotTypes.DOT_PLOT:
      return composeDotPlotWorkBody(config);
    default: {
      throw new Error('Plot type doesn\'t exist');
    }
  }
};

export default generatePlotWorkBody;
