const { loadProcessingSettings } = require('redux/actions/experimentSettings');

const getClusteringSettings = async (experimentId, dispatch, getState) => {
  let clusteringSettings = getState().experimentSettings
    .processing.configureEmbedding?.clusteringSettings;

  if (!clusteringSettings) {
    await dispatch(loadProcessingSettings(experimentId));

    clusteringSettings = getState().experimentSettings
      .processing.configureEmbedding?.clusteringSettings;
  }

  return clusteringSettings;
};

const dependencyGetters = {
  GetEmbedding: [],
  ListGenes: [],
  // Este q onda
  DifferentialExpression: [],
  GeneExpression: [],
  // Este q onda
  GetBackgroundExpressedGenes: [],
  ClusterCells: [],
  // Este q onda
  DotPlot: [],
  GetDoubletScore: [],
  GetMitochondrialContent: [],
  GetExpressionCellSets: [],
  MarkerHeatmap: [getClusteringSettings],
  GetTrajectoryAnalysisStartingNodes: [getClusteringSettings],
  GetTrajectoryAnalysisPseudoTime: [getClusteringSettings],
  GetNormalizedExpression: [getClusteringSettings],
};

const getExtraDependencies = async (experimentId, name, dispatch, getState) => {
  const dependencies = await Promise.all(
    dependencyGetters[name].map(
      (dependencyGetter) => dependencyGetter(experimentId, dispatch, getState),
    ),
  );

  return dependencies;
};

export default getExtraDependencies;
