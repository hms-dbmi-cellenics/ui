const layout = {
  PANEL_HEADING_HEIGHT: 30,
  PANEL_PADDING: 10,
};

const plotTypes = {
  CONTINUOUS_EMBEDDING: 'ContinuousEmbedding',
  CATEGORICAL_EMBEDDING: 'CategoricalEmbedding',
  HEATMAP: 'Heatmap',
  MARKER_HEATMAP: 'MarkerHeatmap',
  VOLCANO_PLOT: 'VolcanoPlot',
  FREQUENCY_PLOT: 'FrequencyPlot',
  VIOLIN_PLOT: 'violin',
  DOT_PLOT: 'DotPlot',
  TRAJECTORY_ANALYSIS: 'TrajectoryAnalysis',
};

const plotNames = {
  CONTINUOUS_EMBEDDING: 'Continuous Embedding',
  CATEGORICAL_EMBEDDING: 'Categorical Embedding',
  HEATMAP: 'Custom Heatmap',
  MARKER_HEATMAP: 'Marker Heatmap',
  VOLCANO_PLOT: 'Volcano Plot',
  FREQUENCY_PLOT: 'Frequency Plot',
  VIOLIN_PLOT: 'Violin Plot',
  DOT_PLOT: 'Dot Plot',
  TRAJECTORY_ANALYSIS: 'Trajectory Analysis',
};

const modules = {
  DATA_MANAGEMENT: 'DATA_MANAGEMENT',
  DATA_PROCESSING: 'DATA_PROCESSING',
  DATA_EXPLORATION: 'DATA_EXPLORATION',
  PLOTS_AND_TABLES: 'PLOTS_AND_TABLES',
  SETTINGS: 'SETTINGS',
  DEFAULT: '',
};

const api = {
  V1: 'v1',
  V2: 'v2',
};

export {
  layout,
  plotNames,
  plotTypes,
  modules,
  api,
};
