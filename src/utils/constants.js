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
  VIOLIN_PLOT: 'ViolinPlot',
  DOT_PLOT: 'DotPlot',
};

const pathStubs = {
  DATA_MANAGEMENT: '/data-management',
  DATA_PROCESSING: '/data-processing',
  DATA_EXPLORATION: '/data-exploration',
  PLOTS_AND_TABLES: '/plots-and-tables',
};

const paths = {
  DATA_MANAGEMENT: pathStubs.DATA_MANAGEMENT,
  DATA_PROCESSING: `/experiments/[experimentId]${pathStubs.DATA_PROCESSING}`,
  DATA_EXPLORATION: `/experiments/[experimentId]${pathStubs.DATA_EXPLORATION}`,
  PLOTS_AND_TABLES: `/experiments/[experimentId]${pathStubs.PLOTS_AND_TABLES}`,
};

export {
  layout,
  plotTypes,
  paths,
  pathStubs,
};
