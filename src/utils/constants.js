import endUserMessages from 'utils/endUserMessages';

const api = {
  V1: 'v1',
  V2: 'v2',
};

const modules = {
  DATA_MANAGEMENT: 'DATA_MANAGEMENT',
  REPOSITORY: 'REPOSITORY',
  DATA_PROCESSING: 'DATA_PROCESSING',
  DATA_EXPLORATION: 'DATA_EXPLORATION',
  PLOTS_AND_TABLES: 'PLOTS_AND_TABLES',
  SETTINGS: 'SETTINGS',
  DEFAULT: '',
};

const sampleTech = {
  '10X': '10x',
  RHAPSODY: 'rhapsody',
};

const plotTypes = {
  CONTINUOUS_EMBEDDING: 'embeddingContinuous',
  CATEGORICAL_EMBEDDING: 'embeddingCategorical',
  MARKER_HEATMAP: 'markerHeatmap',
  VOLCANO_PLOT: 'volcano',
  FREQUENCY_PLOT: 'frequency',
  VIOLIN_PLOT: 'violin',
  DOT_PLOT: 'DotPlot',
  TRAJECTORY_ANALYSIS: 'TrajectoryAnalysis',
  NORMALIZED_EXPRESSION_MATRIX: 'NormalizedExpressionMatrix',
};

const plotUuids = {
  CONTINUOUS_EMBEDDING: 'embeddingContinuousMain',
  CATEGORICAL_EMBEDDING: 'embeddingCategoricalMain',
  MARKER_HEATMAP: 'markerHeatmapPlotMain',
  VOLCANO_PLOT: 'volcanoPlotMain',
  FREQUENCY_PLOT: 'frequencyPlotMain',
  VIOLIN_PLOT: 'ViolinMain',
  DOT_PLOT: 'DotPlotMain',
  TRAJECTORY_ANALYSIS: 'trajectoryAnalysisMain',
  NORMALIZED_EXPRESSION_MATRIX: 'normalized-matrix',
};

const plotNames = {
  CONTINUOUS_EMBEDDING: 'Continuous Embedding',
  CATEGORICAL_EMBEDDING: 'Categorical Embedding',
  MARKER_HEATMAP: 'Heatmap',
  VOLCANO_PLOT: 'Volcano Plot',
  FREQUENCY_PLOT: 'Frequency Plot',
  VIOLIN_PLOT: 'Violin Plot',
  DOT_PLOT: 'Dot Plot',
  TRAJECTORY_ANALYSIS: 'Trajectory Analysis',
  NORMALIZED_EXPRESSION_MATRIX: 'Normalized Expression Matrix',
  BATCH_DIFFERENTIAL_EXPRESSION: 'Batch Differential Expression Table',
};

const layout = {
  PANEL_HEADING_HEIGHT: 30,
  PANEL_PADDING: 10,
};

const downsamplingMethods = {
  GEOSKETCH: 'geosketch',
  NONE: 'none',
  DEFAULT_PERC_TO_KEEP: 5,
};

const cellSetsUpdatedMessages = {
  ClusterCells: endUserMessages.SUCCESS_CELL_SETS_RECLUSTERED,
  ScTypeAnnotate: endUserMessages.SUCCESS_CELL_SETS_ANNOTATED,
};

export {
  api,
  modules,
  sampleTech,
  plotTypes,
  plotUuids,
  plotNames,
  layout,
  downsamplingMethods,
  cellSetsUpdatedMessages,
};
