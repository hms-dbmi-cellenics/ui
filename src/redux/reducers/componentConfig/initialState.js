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
  selectedTracks: ['louvain'],
  groupedTracks: ['sample', 'louvain'],
  expressionValue: 'raw',
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
    yAxisText: '-log10(adj p-value)',
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

  logFoldChangeDomain: 0,
  maxNegativeLogpValueDomain: 0,
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
  proportionGrouping: '',
  legend: {
    ...legendBaseState,
    title: 'Cell Set',
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
  xAxisGrouping: '',
  axisTitlesize: 13,
  geneexpLegendloc: '',
};

// PLOTS & TABLES - Violin
const violinConfig = {
  spec: '1.0.0',
  legend: {
    ...legendBaseState,
    position: 'top',
    enabled: false,
  },
  dimensions: {
    ...dimensionsBaseState,
    width: 700,
    height: 550,
  },
  axes: {
    ...axesBaseState,
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
  shownGene: 'notSelected',
  selectedCellSet: 'louvain',
  selectedPoints: 'All',
  selectedPointsVisible: true,
  statisticsVisible: false,
  kdeBandwidth: 0.3,
  normalised: 'normalised',
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
const embeddingPreviewMitochondrialContentInitialConfig = {
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
  selectedSample: 'sample',
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
  selectedSample: 'sample',
};

const interactiveHeatmapInitialConfig = {
  selectedTracks: ['louvain'],
  groupedTracks: ['sample', 'louvain'],
  expressionValue: 'raw',
  legendIsVisible: true,
};

// CELL SIZE DISTRIBUTION - Cell Size Distribution Histogram
const cellSizeDistributionHistogram = {
  spec: '1.0.0',
  legend: {
    ...legendBaseState,
    position: 'top-left',
  },
  dimensions: {
    ...dimensionsBaseState,
    width: 530,
    height: 400,
  },
  axes: {
    ...axesBaseState,
    xAxisText: '#UMIs in cell',
    yAxisText: '#UMIs * #Cells',
  },
  title: {
    ...titleBaseState,
    fontSize: 20,
  },
  fontStyle: fontStyleBaseState,
  colour: colourBaseState,
  marker: markerBaseState,
  label: labelBaseState,
  minCellSize: 10800,
  binStep: 200,
};

// CELL SIZE DISTRIBUTION - Cell Size Distribution Knee Plot
const cellSizeDistributionKneePlot = {
  spec: '1.0.0',
  legend: {
    ...legendBaseState,
    position: 'top-left',
  },
  dimensions: {
    ...dimensionsBaseState,
    width: 530,
    height: 400,
  },
  axes: {
    ...axesBaseState,
    xAxisText: 'Cell rank',
    yAxisText: '#UMIs in cell',
  },
  title: {
    ...titleBaseState,
    fontSize: 20,
  },
  fontStyle: fontStyleBaseState,
  colour: colourBaseState,
  marker: markerBaseState,
  label: labelBaseState,
  minCellSize: 990,
};

// MITOCHONDRIAL CONTENT - Mitochondrial Fraction Histogram
const mitochondrialFractionHistogram = {
  spec: '1.0.0',
  legend: {
    ...legendBaseState,
    position: 'top-right',
  },
  dimensions: {
    ...dimensionsBaseState,
    width: 530,
    height: 400,
  },
  axes: {
    ...axesBaseState,
    xAxisText: 'Percentage of mitochondrial reads',
    yAxisText: 'Percentage of cells',
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
  binStep: 0.05,
  maxFraction: 0.1,
};

// MITOCHONDRIAL CONTENT - Mitochondrial Fraction Log Histogram
const mitochondrialFractionLogHistogram = {
  spec: '1.0.0',
  legend: {
    ...legendBaseState,
    position: 'top-right',
  },
  dimensions: {
    ...dimensionsBaseState,
    width: 530,
    height: 400,
  },
  axes: {
    ...axesBaseState,
    xAxisText: 'Percentage of mitochondrial reads',
    yAxisText: 'Num of UMIs in cell',
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
  binStep: 0.05,
  maxFraction: 0.2,
};

// CLASSIFIER - Classifier Knee Plot
const classifierKneePlot = {
  spec: '1.0.0',
  legend: {
    ...legendBaseState,
    position: 'top-right',
  },
  dimensions: {
    ...dimensionsBaseState,
    width: 530,
    height: 400,
  },
  axes: {
    ...axesBaseState,
    xAxisText: 'Droplet Rank',
    yAxisText: 'Droplet #UMIs',
  },
  title: {
    ...titleBaseState,
    fontSize: 20,
  },
  fontStyle: fontStyleBaseState,
  colour: colourBaseState,
  marker: markerBaseState,
  label: labelBaseState,
  minCellSize: 990,
};

// CLASSIFIER - Classifier Empty Drops
const classifierEmptyDropsPlot = {
  spec: '1.0.0',
  legend: {
    ...legendBaseState,
    enabled: false,
  },
  dimensions: {
    ...dimensionsBaseState,
    width: 630,
    height: 500,
  },
  axes: {
    ...axesBaseState,
    xAxisText: 'log10[ cell size (UMIs) ]',
    yAxisText: 'FDR (emptyDrops)',
    gridOpacity: 10,
  },
  title: {
    ...titleBaseState,
    fontSize: 20,
  },
  fontStyle: fontStyleBaseState,
  colour: colourBaseState,
  marker: markerBaseState,
  label: labelBaseState,
  minProbability: 0.82,
  bandwidth: -1,
};

// GENES VS UMIS - Features vs UMIs
const featuresVsUMIsScatterplot = {
  spec: '1.0.0',
  dimensions: {
    ...dimensionsBaseState,
    width: 630,
    height: 500,
  },
  axes: {
    ...axesBaseState,
    xAxisText: 'log10 [molecule counts]',
    yAxisText: 'log10 [gene counts]',
    gridOpacity: 10,
  },
  title: {
    ...titleBaseState,
    fontSize: 20,
  },
  fontStyle: fontStyleBaseState,
  colour: colourBaseState,
  label: labelBaseState,
  lower_cutoff: 4.8,
  upper_cutoff: 2.1,
};

// DOUBLE FILTER - Doublet filter histogram
const doubletScoreHistogram = {
  spec: '1.0.0',
  legend: {
    ...legendBaseState,
    position: 'top-right',
  },
  dimensions: {
    ...dimensionsBaseState,
    width: 530,
    height: 400,
  },
  axes: {
    ...axesBaseState,
    xAxisText: 'Probability of being a doublet',
    yAxisText: 'Frequency',
  },
  title: {
    ...titleBaseState,
    fontSize: 20,
  },
  fontStyle: fontStyleBaseState,
  colour: colourBaseState,
  marker: markerBaseState,
  label: labelBaseState,
  binStep: 0.05,
  probThreshold: 0.2,
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
  ...frequencyInitialConfig,
  xAxisGrouping: 'louvain',
  proportionGrouping: 'sample',
  legend: {
    ...legendBaseState,
    title: 'Sample',
    position: 'top',
    offset: 10,
  },
  dimensions: {
    ...dimensionsBaseState,
    width: 700,
    height: 550,
  },

  axes: {
    ...axesBaseState,
    xAxisText: 'Louvain clusters',
    yAxisText: 'Proportion',
    offset: 10,
  },
  fontStyle: fontStyleBaseState,
};

// DATA INTEGRATION - Elbow
const dataIntegrationElbowPlotInitialConfig = {
  legend: {
    ...legendBaseState,
    position: 'top',
  },
  label: { ...labelBaseState },
  dimensions: {
    ...dimensionsBaseState,
    width: 700,
    height: 550,
  },
  marker: { ...markerBaseState },
  fontStyle: fontStyleBaseState,
  axes: {
    ...axesBaseState,
    xAxisText: 'Principal Components',
    yAxisText: 'Proportion of Variance Explained',
    titleFont: 'sans-serif',
    labelFont: 'sans-serif',
    labelFontSize: 13,
    offset: 0,
    gridOpacity: 10,
  },
  colour: {
    toggleInvert: '#FFFFFF',
  },
  title: {
    ...titleBaseState,
    font: 'sans-serif',
    fontSize: 12,
  },
  signals: [
    {
      name: 'interpolate',
      value: 'linear',
      bind: {
        input: 'select',
        options: [
          'basis',
          'cardinal',
          'catmull-rom',
          'linear',
          'monotone',
          'natural',
          'step',
          'step-after',
          'step-before',
        ],
      },
    },
  ],
};

const initialPlotConfigStates = {
  cellSizeDistributionHistogram,
  cellSizeDistributionKneePlot,
  mitochondrialFractionHistogram,
  mitochondrialFractionLogHistogram,
  classifierKneePlot,
  classifierEmptyDropsPlot,
  featuresVsUMIsScatterplot,
  doubletScoreHistogram,
  embeddingCategorical: embeddingCategoricalInitialConfig,
  embeddingContinuous: embeddingContinuousInitialConfig,
  heatmap: heatmapInitialConfig,
  volcano: volcanoInitialConfig,
  violin: violinConfig,
  frequency: frequencyInitialConfig,
  embeddingPreviewBySample: embeddingPreviewBySampleInitialConfig,
  embeddingPreviewByCellSets: embeddingPreviewByCellSetsInitialConfig,
  embeddingPreviewMitochondrialContent: embeddingPreviewMitochondrialContentInitialConfig,
  embeddingPreviewDoubletScore: embeddingPreviewDoubletScoreInitialConfig,
  dataIntegrationEmbedding: dataIntegrationEmbeddingInitialConfig,
  dataIntegrationFrequency: dataIntegrationFrequencyInitialConfig,
  dataIntegrationElbow: dataIntegrationElbowPlotInitialConfig,
};

const initialComponentConfigStates = {
  interactiveHeatmap: interactiveHeatmapInitialConfig,
};
export { initialPlotConfigStates, initialComponentConfigStates };

const initialState = {};
export default initialState;
