import {
  legendBaseState,
  dimensionsBaseState,
  axesBaseState,
  titleBaseState,
  fontStyleBaseState,
  colourBaseState,
  markerBaseState,
  labelBaseState,
} from './basePlotStylingState';

const embeddingCategoricalInitialConfig = {
  spec: '2.0.0',
  ...legendBaseState,
  ...dimensionsBaseState,
  ...axesBaseState,
  ...titleBaseState,
  ...fontStyleBaseState,
  ...colourBaseState,
  ...markerBaseState,
  ...labelBaseState,
  selectedCellSet: 'louvain',
};

const embeddingContinuousInitialConfig = {
  spec: '2.0.0',
  ...legendBaseState,
  ...dimensionsBaseState,
  dimensions: {
    width: 700,
    height: 550,
  },
  ...axesBaseState,
  axes: {
    xAxisText: 'UMAP 1',
    yAxisText: 'UMAP 2',
  },
  ...titleBaseState,
  ...fontStyleBaseState,
  ...colourBaseState,
  ...markerBaseState,
  ...labelBaseState,
  reverseCbar: false,
  logEquation: 'datum.expression*1',
  shownGene: 'CST3',
  selectedSample: 'All',
  widthGrid: 10,
  lineWidth: 2,
};

const heatmapInitialConfig = {
  spec: '2.0.0',
  ...legendBaseState,
  ...dimensionsBaseState,
  ...titleBaseState,
  ...fontStyleBaseState,
  ...colourBaseState,
  ...markerBaseState,
  ...labelBaseState,
  selectedGenes: [],
  selectedCellSet: 'louvain',
  bounceX: 0,
};

const volcanoInitialConfig = {
  spec: '2.0.0',
  ...legendBaseState,
  ...dimensionsBaseState,
  ...markerBaseState,
  ...axesBaseState,
  axes: {
    xAxisText: 'log2 fold change',
    yaxisText: ' - log10(adj.p - value)',
  },
  ...titleBaseState,
  ...fontStyleBaseState,
  ...colourBaseState,
  noDifferenceColor: '#aaaaaa',
  significantUpregulatedColor: '#0000ffaa',
  significantDownregulatedColor: '#ff0000',
  notSignificantDownregulatedColor: '#aaaaaa',
  notSignificantUpregulatedColor: '#aaaaaa',
  significantChangeDirectionUnknownColor: '#aaaaaa',

  // `null` automatically scales to range. This is a problem
  // because our DE is bad right now, so it throws off the
  // range to extreme values. TODO: set this back when we have
  // good DE
  // logFoldChangeDomain: null,

  logFoldChangeDomain: 20,
  maxNegativeLogpValueDomain: null,
  negLogpValueThreshold: 4,
  logFoldChangeThreshold: 1,
  logFoldChangeTickCount: 5,
  negativeLogpValueTickCount: 5,
  downsampleRatio: 0,
  showLogFoldChangeThresholdGuides: true,
  showpvalueThresholdGuides: true,
  thresholdGuideWidth: 1,
  logFoldChangeThresholdColor: '#ff0000',
  pvalueThresholdColor: '#ff0000',
  colGrid: '#000000',
  widthGrid: 10,
  lineWidth: 2,
  reverseCbar: false,
  textThresholdValue: 240,
};
const frequencyInitialConfig = {
  spec: '2.0.0',
  frequencyType: 'proportional',
  metadata: '',
  ...legendBaseState,
  ...labelBaseState,
  ...dimensionsBaseState,
  ...markerBaseState,
  ...colourBaseState,
  ...titleBaseState,
  ...axesBaseState,
  axes: {
    xAxisText: 'Sample',
    yAxisText: 'Proportion',
  },
  ...fontStyleBaseState,
  chosenClusters: '',
  axisTitlesize: 13,
  geneexpLegendloc: '',
};

const interactiveHeatmapInitialConfig = {
  selectedTracks: ['louvain'],
  groupedTracks: ['sample', 'louvain'],
  expressionValue: 'raw',
  legendIsVisible: true,
};

const initialPlotConfigStates = {
  embeddingCategorical: embeddingCategoricalInitialConfig,
  embeddingContinuous: embeddingContinuousInitialConfig,
  heatmap: heatmapInitialConfig,
  volcano: volcanoInitialConfig,
  frequency: frequencyInitialConfig,
};

const initialComponentConfigStates = {
  interactiveHeatmap: interactiveHeatmapInitialConfig,
};
export { initialPlotConfigStates, initialComponentConfigStates };

const initialState = {};
export default initialState;
