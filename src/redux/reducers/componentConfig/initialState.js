import { plotTypes } from 'utils/constants';

import {
  legendBaseState,
  dimensionsBaseState,
  axesBaseState,
  axesRangesBaseState,
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
    xAxisText: 'Umap 1',
    yAxisText: 'Umap 2',
    defaultValues: ['x', 'y'],
    offset: 0,
  },
  axesRanges: axesRangesBaseState,
  title: {
    ...titleBaseState,
    fontSize: 20,
  },
  fontStyle: fontStyleBaseState,
  colour: colourBaseState,
  marker: markerBaseState,
  labels: {
    ...labelBaseState,
    enabled: false,
  },
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
    xAxisText: 'Umap 1',
    yAxisText: 'Umap 2',
    defaultValues: ['x', 'y'],
    offset: 10,
  },
  axesRanges: axesRangesBaseState,
  title: {
    ...titleBaseState,
    dx: 0,
    fontSize: 20,
  },
  fontStyle: fontStyleBaseState,
  colour: colourBaseState,
  marker: markerBaseState,
  labels: labelBaseState,
  logEquation: 'datum.expression*1',
  shownGene: null,
  expressionValue: 'raw',
  truncatedValues: true,
  selectedSample: 'All',
  keepValuesOnReset: ['shownGene'],
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
  labels: labelBaseState,
  selectedGenes: [],
  selectedCellSet: 'louvain',
  selectedPoints: 'All',
  labelColour: 'transparent',
  selectedTracks: ['louvain'],
  groupedTracks: ['sample', 'louvain'],
  expressionValue: 'raw',
  truncatedValues: true,
};

// PLOTS & TABLES - Marker heatmap
const markerHeatmapInitialConfig = {
  ...heatmapInitialConfig,
  useMarkerGenes: false,
  guardLines: false,
  nMarkerGenes: 5,
  showGeneLabels: true,
  keepValuesOnReset: ['selectedGenes'],
};

// PLOTS & TABLES - Volcano plot
const volcanoInitialConfig = {
  spec: '1.0.0',
  legend: {
    ...legendBaseState,
    position: 'bottom-right',
  },
  dimensions: dimensionsBaseState,
  marker: {
    ...markerBaseState,
    showOpacity: false,
    size: 32,
  },
  axes: {
    ...axesBaseState,
    xAxisText: 'log fold change',
    yAxisText: '-log10(adj p-value)',
    gridOpacity: 5,
    offset: 10,
  },
  axesRanges: axesRangesBaseState,
  title: titleBaseState,
  fontStyle: fontStyleBaseState,
  colour: colourBaseState,
  labels: labelBaseState,
  noDifferenceColor: '#aaaaaa',
  significantUpregulatedColor: '#0000ffaa',
  significantDownregulatedColor: '#ff0000',

  xAxisAuto: true,
  yAxisAuto: true,
  logFoldChangeDomain: 1,
  maxNegativeLogpValueDomain: 50,
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
  legend: {
    ...legendBaseState,
    title: 'Cell Set',
    position: 'top',
    offset: 40,
  },
  labels: labelBaseState,
  dimensions: dimensionsBaseState,
  marker: markerBaseState,
  colour: colourBaseState,
  title: titleBaseState,
  axes: {
    ...axesBaseState,
    xAxisText: 'Sample',
    yAxisText: 'Proportion',
    xAxisRotateLabels: true,
    offset: 10,
  },
  axesRanges: {
    yAxisAuto: true,
    yMin: 0,
    yMax: 10,
  },
  fontStyle: fontStyleBaseState,
  proportionGrouping: 'louvain',
  xAxisGrouping: 'sample',
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
    xAxisRotateLabels: true,
  },
  axesRanges: {
    yAxisAuto: true,
    yMin: 0,
    yMax: 10,
  },
  title: {
    ...titleBaseState,
    dx: 0,
    fontSize: 20,
  },
  fontStyle: fontStyleBaseState,
  colour: colourBaseState,
  marker: markerBaseState,
  labels: labelBaseState,
  shownGene: 'notSelected',
  selectedCellSet: 'louvain',
  selectedPoints: 'All',
  selectedPointsVisible: true,
  statisticsVisible: false,
  kdeBandwidth: 0.3,
  normalised: 'normalised',
  keepValuesOnReset: ['shownGene', 'title'],
};

// PLOTS & TABLES - Dot Plot
const dotPlotConfig = {
  spec: '1.0.0',
  legend: {
    ...legendBaseState,
    position: 'right',
    enabled: true,
    direction: 'vertical',
  },
  dimensions: {
    ...dimensionsBaseState,
    width: 700,
    height: 550,
  },
  axes: {
    ...axesBaseState,
    tickOffset: 10,
    xAxisRotateLabels: true,
    xAxisText: 'Gene names',
    yAxisText: 'Louvain clusters',
  },
  title: {
    ...titleBaseState,
    dx: 0,
    fontSize: 20,
  },
  fontStyle: fontStyleBaseState,
  colour: colourBaseState,
  marker: markerBaseState,
  labels: labelBaseState,
  useAbsoluteScale: true,
  useMarkerGenes: false,
  nMarkerGenes: 3,
  selectedGenes: [],
  selectedCellSet: 'louvain',
  selectedPoints: 'All',
  keepValuesOnReset: ['selectedGenes'],
};

// PLOTS & TABLES - Trajectory Analysis
const trajectoryAnalysisInitialConfig = {
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
    xAxisText: 'Umap 1',
    yAxisText: 'Umap 2',
    defaultValues: ['x', 'y'],
  },
  axesRanges: axesRangesBaseState,
  title: {
    ...titleBaseState,
    fontSize: 20,
  },
  fontStyle: fontStyleBaseState,
  colour: colourBaseState,
  marker: {
    ...markerBaseState,
    size: 20,
  },
  labels: {
    ...labelBaseState,
    enabled: false,
  },
  selectedNodes: [],
  selectedCellSet: 'louvain',
  selectedSample: 'All',
};

// PLOTS & TABLES - Multi view
const multiViewInitialConfig = {
  ncols: 1,
  nrows: 1,
  plotUuids: [],
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
    xAxisText: '',
    yAxisText: '',
    defaultValues: ['x', 'y'],
    offset: 10,
  },
  axesRanges: axesRangesBaseState,
  title: {
    ...titleBaseState,
    fontSize: 20,
  },
  fontStyle: fontStyleBaseState,
  colour: colourBaseState,
  marker: markerBaseState,
  labels: {
    ...labelBaseState,
    enabled: false,
  },
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
    xAxisText: '',
    yAxisText: '',
    defaultValues: ['x', 'y'],
    offset: 10,
  },
  axesRanges: axesRangesBaseState,
  title: {
    ...titleBaseState,
    fontSize: 20,
  },
  fontStyle: fontStyleBaseState,
  colour: colourBaseState,
  marker: markerBaseState,
  labels: {
    ...labelBaseState,
    enabled: false,
  },
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
    xAxisText: '',
    yAxisText: '',
    defaultValues: ['x', 'y'],
    offset: 10,
  },
  axesRanges: axesRangesBaseState,
  title: {
    ...titleBaseState,
    dx: 0,
    fontSize: 20,
  },
  fontStyle: fontStyleBaseState,
  colour: colourBaseState,
  marker: markerBaseState,
  labels: labelBaseState,
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
    xAxisText: '',
    yAxisText: '',
    defaultValues: ['x', 'y'],
    offset: 10,
  },
  axesRanges: axesRangesBaseState,
  title: {
    ...titleBaseState,
    dx: 0,
    fontSize: 20,
  },
  fontStyle: fontStyleBaseState,
  colour: colourBaseState,
  marker: markerBaseState,
  labels: labelBaseState,
  selectedSample: 'All',
};

const embeddingPreviewNumOfGenesInitialConfig = {
  spec: '1.0.0',
  legend: legendBaseState,
  dimensions: {
    ...dimensionsBaseState,
    width: 700,
    height: 550,
  },
  axes: {
    ...axesBaseState,
    xAxisText: '',
    yAxisText: '',
    defaultValues: ['x', 'y'],
    offset: 10,
  },
  axesRanges: axesRangesBaseState,
  title: {
    ...titleBaseState,
    dx: 0,
    fontSize: 20,
  },
  fontStyle: fontStyleBaseState,
  colour: colourBaseState,
  marker: markerBaseState,
  labels: labelBaseState,
  selectedSample: 'All',
};
const embeddingPreviewNumOfUmisInitialConfig = {
  spec: '1.0.0',
  legend: legendBaseState,
  dimensions: {
    ...dimensionsBaseState,
    width: 700,
    height: 550,
  },
  axes: {
    ...axesBaseState,
    xAxisText: '',
    yAxisText: '',
    defaultValues: ['x', 'y'],
    offset: 10,
  },
  axesRanges: axesRangesBaseState,
  title: {
    ...titleBaseState,
    dx: 0,
    fontSize: 20,
  },
  fontStyle: fontStyleBaseState,
  colour: colourBaseState,
  marker: markerBaseState,
  labels: labelBaseState,
  selectedSample: 'All',
};

const interactiveHeatmapInitialConfig = {
  selectedCellSet: 'louvain',
  selectedPoints: 'All',
  selectedTracks: ['louvain'],
  groupedTracks: ['louvain', 'sample'],
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
  axesRanges: axesRangesBaseState,
  title: {
    ...titleBaseState,
    fontSize: 20,
  },
  fontStyle: fontStyleBaseState,
  colour: colourBaseState,
  marker: markerBaseState,
  labels: labelBaseState,
  minCellSize: 10800,
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
  axesRanges: {
    ...axesRangesBaseState,
    xMin: 1,
    yMin: 1,
  },
  title: {
    ...titleBaseState,
    fontSize: 20,
  },
  fontStyle: fontStyleBaseState,
  colour: colourBaseState,
  marker: markerBaseState,
  labels: labelBaseState,
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
  axesRanges: axesRangesBaseState,
  title: {
    ...titleBaseState,
    fontSize: 20,
    dx: 0,
  },
  fontStyle: fontStyleBaseState,
  colour: colourBaseState,
  marker: markerBaseState,
  labels: labelBaseState,
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
  axesRanges: axesRangesBaseState,
  title: {
    ...titleBaseState,
    fontSize: 20,
    dx: 0,
  },
  fontStyle: fontStyleBaseState,
  colour: colourBaseState,
  marker: markerBaseState,
  labels: labelBaseState,
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
  axesRanges: {
    ...axesRangesBaseState,
    xMin: 1,
    yMin: 1,
  },
  title: {
    ...titleBaseState,
    fontSize: 20,
  },
  fontStyle: fontStyleBaseState,
  colour: colourBaseState,
  marker: markerBaseState,
  labels: labelBaseState,
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
  axesRanges: axesRangesBaseState,
  title: {
    ...titleBaseState,
    fontSize: 20,
  },
  fontStyle: fontStyleBaseState,
  colour: colourBaseState,
  marker: markerBaseState,
  labels: labelBaseState,
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
  axesRanges: axesRangesBaseState,
  title: {
    ...titleBaseState,
    fontSize: 20,
  },
  fontStyle: fontStyleBaseState,
  colour: colourBaseState,
  labels: labelBaseState,
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
  axesRanges: axesRangesBaseState,
  title: {
    ...titleBaseState,
    fontSize: 20,
  },
  fontStyle: fontStyleBaseState,
  colour: colourBaseState,
  marker: markerBaseState,
  labels: labelBaseState,
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
    xAxisText: '',
    yAxisText: '',
    defaultValues: ['x', 'y'],
    offset: 10,
  },
  axesRanges: axesRangesBaseState,
  title: {
    ...titleBaseState,
    fontSize: 20,
  },
  fontStyle: fontStyleBaseState,
  colour: colourBaseState,
  marker: markerBaseState,
  labels: {
    ...labelBaseState,
    enabled: false,
  },
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
    xAxisRotateLabels: true,
    offset: 10,
  },
  axesRanges: {
    yAxisAuto: true,
    yMin: 0,
    yMax: 10,
  },
  fontStyle: fontStyleBaseState,
};

// DATA INTEGRATION - Elbow
const dataIntegrationElbowPlotInitialConfig = {
  legend: {
    ...legendBaseState,
    position: 'top',
  },
  labels: labelBaseState,
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
  axesRanges: axesRangesBaseState,
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

const normalizedMatrixPlotConfig = {
  sample: [],
  louvain: [],
  metadata: [],
  scratchpad: [],
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
  markerHeatmap: markerHeatmapInitialConfig,
  violin: violinConfig,
  [plotTypes.NORMALIZED_EXPRESSION_MATRIX]: normalizedMatrixPlotConfig,
  [plotTypes.DOT_PLOT]: dotPlotConfig,
  [plotTypes.TRAJECTORY_ANALYSIS]: trajectoryAnalysisInitialConfig,
  frequency: frequencyInitialConfig,
  embeddingPreviewBySample: embeddingPreviewBySampleInitialConfig,
  embeddingPreviewByCellSets: embeddingPreviewByCellSetsInitialConfig,
  embeddingPreviewMitochondrialContent: embeddingPreviewMitochondrialContentInitialConfig,
  embeddingPreviewDoubletScore: embeddingPreviewDoubletScoreInitialConfig,
  embeddingPreviewNumOfGenes: embeddingPreviewNumOfGenesInitialConfig,
  embeddingPreviewNumOfUmis: embeddingPreviewNumOfUmisInitialConfig,
  dataIntegrationEmbedding: dataIntegrationEmbeddingInitialConfig,
  dataIntegrationFrequency: dataIntegrationFrequencyInitialConfig,
  dataIntegrationElbow: dataIntegrationElbowPlotInitialConfig,
};

const initialComponentConfigStates = {
  interactiveHeatmap: interactiveHeatmapInitialConfig,
  multiView: multiViewInitialConfig,
};

const initialPlotDataState = {
  plotData: [],
  loading: false,
  error: false,
};

export {
  initialPlotConfigStates,
  initialComponentConfigStates,
  initialPlotDataState,
};

const initialState = {};
export default initialState;
