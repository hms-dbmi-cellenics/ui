import {
  legendBaseState,
  dimensionsBaseState,
  axesBaseState,
  titleBaseState,
  fontStyleBaseState,
  colourBaseState,
  markerBaseState,
  labelBaseState,
} from './baseStylesState';

// PLOTS & TABLES - Categorical Embedding
const embeddingCategoricalInitialConfig = {
  spec: '1.0.0',
  legend: {
    ...legendBaseState,
    position: 'top',
  },
  dimensions: {
    ...dimensionsBaseState,
    width: 700,
    height: 550,
  },
  axes: {
    ...axesBaseState,
    xAxisText: 'UMAP 1',
    yAxisText: 'UMAP 2',
    offset: 10,
  },
  title: {
    ...titleBaseState,
    fontSize: 20,
  },
  fontStyle: fontStyleBaseState,
  colour: colourBaseState,
  marker: markerBaseState,
  label: labelBaseState,
  selectedCellSet: 'louvain',
  selectedSample: 'All',
};

// PLOTS & TABLES - Continuous Embedding
const embeddingContinuousInitialConfig = {
  spec: '1.0.0',
  legend: legendBaseState,
  dimensions: {
    ...dimensionsBaseState,
    width: 700,
    height: 550,
  },
  axes: {
    ...axesBaseState,
    xAxisText: 'UMAP 1',
    yAxisText: 'UMAP 2',
    offset: 10,
  },
  title: {
    ...titleBaseState,
    dx: 0,
    fontSize: 20,
  },
  fontStyle: fontStyleBaseState,
  colour: colourBaseState,
  marker: markerBaseState,
  label: labelBaseState,
  logEquation: 'datum.expression*1',
  shownGene: 'notSelected',
  selectedSample: 'All',
};

// PLOTS & TABLES - Heatmap
const heatmapInitialConfig = {
  spec: '1.0.0',
  legend: {
    ...legendBaseState,
    show: true,
    position: 'horizontal',
  },
  dimensions: {
    ...dimensionsBaseState,
    width: 500,
    height: 500,
  },
  title: {
    ...titleBaseState,
    fontSize: 20,
    dx: 0,
  },
  fontStyle: fontStyleBaseState,
  colour: colourBaseState,
  marker: markerBaseState,
  label: labelBaseState,
  selectedGenes: [],
  selectedCellSet: 'louvain',
  labelColour: 'transparent',
};

// PLOTS & TABLES - Volcano plot
const volcanoInitialConfig = {
  spec: '1.0.0',
  legend: legendBaseState,
  dimensions: dimensionsBaseState,
  marker: {
    ...markerBaseState,
    size: 32,
  },
  axes: {
    ...axesBaseState,
    xAxisText: 'log2 fold change',
    yAxisText: ' - log10(adj.p - value)',
    gridOpacity: 5,
    offset: 10,
  },
  title: titleBaseState,
  fontStyle: fontStyleBaseState,
  colour: colourBaseState,
  label: labelBaseState,
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
  textThresholdValue: 240,
  strokeOpa: 1,
  strokeCol: '#000000',
};

// PLOTS & TABLES - Frequency
const frequencyInitialConfig = {
  spec: '1.0.0',
  frequencyType: 'proportional',
  metadata: '',
  legend: {
    ...legendBaseState,
    position: 'top',
    offset: 40,
  },
  label: labelBaseState,
  dimensions: dimensionsBaseState,
  marker: markerBaseState,
  colour: colourBaseState,
  title: titleBaseState,
  axes: {
    ...axesBaseState,
    xAxisText: 'Sample',
    yAxisText: 'Proportion',
    offset: 10,
  },
  fontStyle: fontStyleBaseState,
  chosenClusters: '',
  axisTitlesize: 13,
  geneexpLegendloc: '',
};

// EMBEDDING PREVIEW - Coloured by sample
const embeddingPreviewBySampleInitialConfig = {
  spec: '1.0.0',
  legend: {
    ...legendBaseState,
    position: 'top',
  },
  dimensions: {
    ...dimensionsBaseState,
    width: 700,
    height: 550,
  },
  axes: {
    ...axesBaseState,
    xAxisText: 'UMAP 1',
    yAxisText: 'UMAP 2',
    offset: 10,
  },
  title: {
    ...titleBaseState,
    fontSize: 20,
  },
  fontStyle: fontStyleBaseState,
  colour: colourBaseState,
  marker: markerBaseState,
  label: labelBaseState,
  selectedCellSet: 'louvain',
  selectedSample: 'All',
};

// EMBEDDING PREVIEW - Coloured by cell sets
const embeddingPreviewByCellSetsInitialConfig = {
  spec: '1.0.0',
  legend: {
    ...legendBaseState,
    position: 'top',
  },
  dimensions: {
    ...dimensionsBaseState,
    width: 700,
    height: 550,
  },
  axes: {
    ...axesBaseState,
    xAxisText: 'UMAP 1',
    yAxisText: 'UMAP 2',
    offset: 10,
  },
  title: {
    ...titleBaseState,
    fontSize: 20,
  },
  fontStyle: fontStyleBaseState,
  colour: colourBaseState,
  marker: markerBaseState,
  label: labelBaseState,
  selectedCellSet: 'louvain',
  selectedSample: 'All',
};

// EMBEDDING PREVIEW - Config for fraction of mitochondrial reads
const embeddingPreviewMitochondrialReadsInitialConfig = {
  spec: '1.0.0',
  legend: legendBaseState,
  dimensions: {
    ...dimensionsBaseState,
    width: 700,
    height: 550,
  },
  axes: {
    ...axesBaseState,
    xAxisText: 'UMAP 1',
    yAxisText: 'UMAP 2',
    offset: 10,
  },
  title: {
    ...titleBaseState,
    dx: 0,
    fontSize: 20,
  },
  fontStyle: fontStyleBaseState,
  colour: colourBaseState,
  marker: markerBaseState,
  label: labelBaseState,
  logEquation: 'datum.expression*1',
  shownGene: 'notSelected',
  selectedSample: 'All',
};

// EMBEDDING PREVIEW - Config for doublet score
const embeddingPreviewDoubletScoreInitialConfig = {
  spec: '1.0.0',
  legend: legendBaseState,
  dimensions: {
    ...dimensionsBaseState,
    width: 700,
    height: 550,
  },
  axes: {
    ...axesBaseState,
    xAxisText: 'UMAP 1',
    yAxisText: 'UMAP 2',
    offset: 10,
  },
  title: {
    ...titleBaseState,
    dx: 0,
    fontSize: 20,
  },
  fontStyle: fontStyleBaseState,
  colour: colourBaseState,
  marker: markerBaseState,
  label: labelBaseState,
  logEquation: 'datum.expression*1',
  shownGene: 'notSelected',
  selectedSample: 'All',
};

const interactiveHeatmapInitialConfig = {
  selectedTracks: ['louvain'],
  groupedTracks: ['sample', 'louvain'],
  expressionValue: 'raw',
  legendIsVisible: true,
};

// DATA INTEGRATION - Embedding by Samples
const dataIntegrationEmbeddingInitialConfig = {
  spec: '1.0.0',
  legend: {
    ...legendBaseState,
    position: 'top',
  },
  dimensions: {
    ...dimensionsBaseState,
    width: 700,
    height: 550,
  },
  axes: {
    ...axesBaseState,
    xAxisText: 'UMAP 1',
    yAxisText: 'UMAP 2',
    offset: 10,
  },
  title: {
    ...titleBaseState,
    fontSize: 20,
  },
  fontStyle: fontStyleBaseState,
  colour: colourBaseState,
  marker: markerBaseState,
  label: labelBaseState,
  selectedCellSet: 'louvain',
  selectedSample: 'All',
};

// DATA INTEGRATION - Frequency
const dataIntegrationFrequencyInitialConfig = {
  spec: '1.0.0',
  frequencyType: 'proportional',
  metadata: 'louvain',
  chosenClusters: 'sample',
  legend: {
    ...legendBaseState,
    position: 'right',
    offset: 10,
  },
  label: labelBaseState,
  dimensions: {
    ...dimensionsBaseState,
    width: 700,
    height: 550,
  },
  marker: markerBaseState,
  colour: colourBaseState,
  title: titleBaseState,
  axes: {
    ...axesBaseState,
    xAxisText: 'Sample',
    yAxisText: 'Proportion',
    offset: 10,
  },
  fontStyle: fontStyleBaseState,
  axisTitlesize: 13,
  geneexpLegendloc: '',
};

const initialPlotConfigStates = {
  embeddingCategorical: embeddingCategoricalInitialConfig,
  embeddingContinuous: embeddingContinuousInitialConfig,
  heatmap: heatmapInitialConfig,
  volcano: volcanoInitialConfig,
  frequency: frequencyInitialConfig,
  embeddingPreviewBySample: embeddingPreviewBySampleInitialConfig,
  embeddingPreviewByCellSets: embeddingPreviewByCellSetsInitialConfig,
  embeddingPreviewMitochondrialReads: embeddingPreviewMitochondrialReadsInitialConfig,
  embeddingPreviewDoubletScore: embeddingPreviewDoubletScoreInitialConfig,
  dataIntegrationEmbedding: dataIntegrationEmbeddingInitialConfig,
  dataIntegrationFrequency: dataIntegrationFrequencyInitialConfig,
};

const initialComponentConfigStates = {
  interactiveHeatmap: interactiveHeatmapInitialConfig,
};
export { initialPlotConfigStates, initialComponentConfigStates };

const initialState = {};
export default initialState;
